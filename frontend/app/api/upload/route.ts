import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import pdfParse from 'pdf-parse'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempPath = join('/tmp', file.name)
    await writeFile(tempPath, buffer)

    // Parse PDF
    const pdfData = await pdfParse(buffer)

    // Create document record
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        file_name: file.name,
        category,
        status: 'Processing'
      })
      .select()
      .single()

    if (docError) throw docError

    // Split into chunks (simple by page)
    const text = pdfData.text
    const chunkSize = 1000
    const chunks = []
    
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize))
    }

    // Create embeddings and insert
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      
      const embeddingRes = await openai.embeddings.create({
        input: [chunk],
        model: 'text-embedding-ada-002'
      })

      const embedding = embeddingRes.data[0].embedding

      await supabase.from('knowledge_embeddings').insert({
        document_id: docData.id,
        content: chunk,
        embedding,
        metadata: {
          file: file.name,
          page: Math.floor(i / 2) + 1,
          category
        }
      })
    }

    // Update status
    await supabase
      .from('documents')
      .update({ status: 'Completed' })
      .eq('id', docData.id)

    // Clean up
    await unlink(tempPath)

    return NextResponse.json({ ok: true, documentId: docData.id })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}