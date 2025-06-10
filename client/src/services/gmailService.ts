// Gmail API integration service
const GMAIL_SYNC_API = 'https://n8n.1000.school/webhook/gmail-sync'
const GMAIL_FILTER_API = 'https://n8n.1000.school/webhook/gmail-filter'

interface GmailEmail {
  mail_id: string
  subject: string
  mail_type: string
  classification_reason: string
  summary: string
}

interface GmailFilterResponse {
  output: GmailEmail[]
}

export const syncGmailData = async (accessToken: string): Promise<void> => {
  try {
    const response = await fetch(GMAIL_SYNC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: accessToken
      })
    })

    if (!response.ok) {
      throw new Error(`Gmail sync failed: ${response.statusText}`)
    }

    console.log('Gmail data synced successfully')
  } catch (error) {
    console.error('Error syncing Gmail data:', error)
    throw error
  }
}

export const getFilteredEmails = async (): Promise<GmailEmail[]> => {
  try {
    const response = await fetch(GMAIL_FILTER_API, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!response.ok) {
      throw new Error(`Gmail filter failed: ${response.statusText}`)
    }

    const data: GmailFilterResponse[] = await response.json()
    
    // Extract emails from the nested structure
    return data.length > 0 && data[0].output ? data[0].output : []
  } catch (error) {
    console.error('Error fetching filtered emails:', error)
    throw error
  }
}