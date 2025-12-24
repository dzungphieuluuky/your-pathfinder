import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export class FeedbackService {
  async saveFeedback(messageId: string, userId: string, rating: boolean, comment?: string) {
    const { data, error } = await supabase.from('feedback').insert({
      message_id: messageId,
      user_id: userId,
      rating,
      comment
    })

    if (error) {
      console.error('Error saving feedback:', error)
      return false
    }

    return true
  }

  async getFeedbackStats() {
    const { data, error } = await supabase
      .from('feedback')
      .select('rating')

    if (error) {
      console.error('Error fetching feedback:', error)
      return { positive: 0, negative: 0, total: 0 }
    }

    const positive = data.filter(f => f.rating === true).length
    const negative = data.filter(f => f.rating === false).length

    return {
      positive,
      negative,
      total: data.length,
      satisfaction: data.length > 0 ? (positive / data.length) * 100 : 0
    }
  }
}