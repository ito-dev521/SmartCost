import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json()

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json({ error: '会社名が必要です' }, { status: 400 })
    }

    const prompt = `
以下の会社名に基づいて、日本の住所候補を3つ提案してください。
会社名の特徴（業種、規模、地域など）を考慮して、適切で多様な住所候補を提案してください。

会社名: ${companyName}

以下の点に注意してください：
1. 建設業の会社なら、工場や事務所が立地しそうな地域
2. 商社なら、オフィス街や商業地域
3. 製造業なら、工業団地や産業集積地域
4. 地域性を考慮（関東、関西、中部など）
5. 実際に存在しそうな住所番地

回答は以下のJSON形式で返してください：
{
  "suggestions": [
    "都道府県 市区町村 番地",
    "都道府県 市区町村 番地", 
    "都道府県 市区町村 番地"
  ]
}

例として、建設業の会社なら：
- 工業団地周辺
- 港湾近く
- 高速道路沿い
などが適切です。
`

    console.log('🔍 OpenAI API呼び出し開始:', { companyName })
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "あなたは日本の地理と企業立地に詳しい専門家です。会社名の特徴を分析して、業種や規模に適した住所候補を提案してください。常に異なる地域や特徴を持つ住所を提案し、同じパターンを繰り返さないでください。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    })

    const responseText = completion.choices[0]?.message?.content || ''
    console.log('📋 OpenAI API応答:', responseText)
    console.log('🔍 応答の長さ:', responseText.length)
    console.log('🔍 応答の内容確認:', responseText.substring(0, 200) + '...')
    
    try {
      const suggestions = JSON.parse(responseText)
      console.log('✅ JSONパース成功:', suggestions)
      return NextResponse.json(suggestions)
    } catch (parseError) {
      console.log('⚠️ JSONパース失敗、テキストから住所を抽出:', parseError)
      // JSONパースに失敗した場合、テキストから住所を抽出
      const addressPattern = /[東京都|大阪府|愛知県|神奈川県|埼玉県|千葉県|兵庫県|福岡県|静岡県|茨城県|栃木県|群馬県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|三重県|滋賀県|京都府|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県][\s\S]*?[0-9]+-[0-9]+-[0-9]+/g
      const matches = responseText.match(addressPattern) || []
      console.log('📋 正規表現で抽出された住所:', matches)
      
      return NextResponse.json({
        suggestions: matches.slice(0, 3)
      })
    }

  } catch (error) {
    console.error('住所候補取得エラー:', error)
    return NextResponse.json({ 
      error: '住所候補の取得に失敗しました',
      suggestions: [
        '東京都渋谷区渋谷1-1-1',
        '東京都新宿区新宿2-2-2',
        '東京都港区赤坂3-3-3'
      ]
    }, { status: 500 })
  }
}
