import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json()

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json({ error: '会社名が必要です' }, { status: 400 })
    }


    // 企業ナビの検索URLを構築
    const searchUrl = `https://corp.navi.com/search?q=${encodeURIComponent(companyName)}`
    
    try {
      // 企業ナビから情報を取得
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (!response.ok) {
        throw new Error(`企業ナビからの取得に失敗: ${response.status}`)
      }

      const html = await response.text()
      
      // HTMLから企業情報を抽出（簡易版）
      const companyInfo = extractCompanyInfo(html, companyName)
      
      if (companyInfo) {
        return NextResponse.json(companyInfo)
      } else {
        // 企業情報が見つからない場合、一般的な住所候補を返す
        return NextResponse.json({
          suggestions: generateGeneralAddresses(companyName),
          source: 'general'
        })
      }

    } catch (scrapingError) {
      console.error('❌ スクレイピングエラー:', scrapingError)
      
      // スクレイピングに失敗した場合、一般的な住所候補を返す
      return NextResponse.json({
        suggestions: generateGeneralAddresses(companyName),
        source: 'fallback'
      })
    }

  } catch (error) {
    console.error('企業情報取得エラー:', error)
    return NextResponse.json({ 
      error: '企業情報の取得に失敗しました',
      suggestions: [
        '東京都渋谷区渋谷1-1-1',
        '東京都新宿区新宿2-2-2',
        '東京都港区赤坂3-3-3'
      ]
    }, { status: 500 })
  }
}

// HTMLから企業情報を抽出する関数
function extractCompanyInfo(html: string, companyName: string) {
  try {
    // 住所パターンを検索
    const addressPattern = /([東京都|大阪府|愛知県|神奈川県|埼玉県|千葉県|兵庫県|福岡県|静岡県|茨城県|栃木県|群馬県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|三重県|滋賀県|京都府|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県][\s\S]*?[0-9]+-[0-9]+-[0-9]+)/g
    
    const addresses = html.match(addressPattern)
    
    if (addresses && addresses.length > 0) {
      // 重複を除去して最大3件まで返す
      const uniqueAddresses = [...new Set(addresses)].slice(0, 3)
      
      return {
        companyName,
        suggestions: uniqueAddresses,
        source: 'corp.navi'
      }
    }
    
    return null
  } catch (error) {
    console.error('HTML解析エラー:', error)
    return null
  }
}

// 会社名に基づいて一般的な住所候補を生成
function generateGeneralAddresses(companyName: string) {
  const addresses = []
  
  // 会社名の特徴に基づいて住所を生成
  if (companyName.includes('建設') || companyName.includes('工務店')) {
    addresses.push(
      '東京都江戸川区葛西1-1-1',
      '大阪府大阪市淀川区西中島1-1-1',
      '愛知県名古屋市中区栄1-1-1'
    )
  } else if (companyName.includes('商事') || companyName.includes('商社')) {
    addresses.push(
      '東京都千代田区丸の内1-1-1',
      '大阪府大阪市中央区本町1-1-1',
      '愛知県名古屋市中区錦1-1-1'
    )
  } else if (companyName.includes('工業') || companyName.includes('製造')) {
    addresses.push(
      '神奈川県川崎市川崎区浮島町1-1-1',
      '大阪府大阪市此花区島屋1-1-1',
      '愛知県豊田市元城町1-1-1'
    )
  } else {
    // デフォルト
    addresses.push(
      '東京都渋谷区渋谷1-1-1',
      '大阪府大阪市北区梅田1-1-1',
      '愛知県名古屋市中区三の丸1-1-1'
    )
  }
  
  return addresses
}














