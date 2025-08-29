const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '設定済み' : '未設定')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '設定済み' : '未設定')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkE04_002() {
  try {
    console.log('🔍 E04-002プロジェクト情報を確認中...\n')

    // E04-002プロジェクトを検索
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .ilike('business_number', '%E04-002%')
      .single()

    if (projectError) {
      console.error('❌ プロジェクト検索エラー:', projectError)
      return
    }

    if (!project) {
      console.log('❌ E04-002プロジェクトが見つかりません')
      return
    }

    console.log('📋 プロジェクト情報:')
    console.log(`   業務番号: ${project.business_number}`)
    console.log(`   プロジェクト名: ${project.name}`)
    console.log(`   クライアント名: ${project.client_name}`)
    console.log(`   契約金額: ${project.contract_amount?.toLocaleString()}円`)
    console.log(`   開始日: ${project.start_date}`)
    console.log(`   終了日: ${project.end_date}`)
    console.log(`   ステータス: ${project.status}\n`)

    // クライアント情報を検索
    if (project.client_name) {
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('name', project.client_name)
        .single()

      if (clientError) {
        console.error('❌ クライアント検索エラー:', clientError)
      } else if (client) {
        console.log('📋 クライアント情報:')
        console.log(`   クライアント名: ${client.name}`)
        console.log(`   入金サイクルタイプ: ${client.payment_cycle_type}`)
        console.log(`   締め日: ${client.payment_cycle_closing_day}日`)
        console.log(`   支払い月オフセット: ${client.payment_cycle_payment_month_offset}ヶ月`)
        console.log(`   支払い日: ${client.payment_cycle_payment_day}日`)
        console.log(`   入金サイクル説明: ${client.payment_cycle_description}\n`)

        // 入金予定日の計算テスト
        if (project.end_date && client.payment_cycle_type) {
          console.log('🔍 入金予定日計算テスト:')
          
          const endDate = new Date(project.end_date)
          let paymentDate = new Date()

          if (client.payment_cycle_type === 'month_end') {
            // 月末締め翌月末払いの場合
            paymentDate.setFullYear(endDate.getFullYear())
            paymentDate.setMonth(endDate.getMonth() + 1)
            paymentDate.setDate(0) // その月の末日
          } else if (client.payment_cycle_type === 'specific_date') {
            // 特定日締めの場合
            const closingDay = client.payment_cycle_closing_day || 25
            const paymentMonthOffset = client.payment_cycle_payment_month_offset || 1
            const paymentDay = client.payment_cycle_payment_day || 15

            if (endDate.getDate() <= closingDay) {
              paymentDate.setFullYear(endDate.getFullYear())
              paymentDate.setMonth(endDate.getMonth() + paymentMonthOffset)
              paymentDate.setDate(paymentDay)
            } else {
              paymentDate.setFullYear(endDate.getFullYear())
              paymentDate.setMonth(endDate.getMonth() + paymentMonthOffset + 1)
              paymentDate.setDate(paymentDay)
            }
          }

          console.log(`   完了日: ${endDate.toLocaleDateString('ja-JP')}`)
          console.log(`   計算された入金予定日: ${paymentDate.toLocaleDateString('ja-JP')}`)
          console.log(`   入金予定月: ${paymentDate.getMonth() + 1}月`)
        }
      } else {
        console.log('❌ クライアント情報が見つかりません')
      }
    }

    // 全てのプロジェクトを表示
    console.log('\n📋 全プロジェクト一覧:')
    const { data: allProjects, error: allProjectsError } = await supabase
      .from('projects')
      .select('*')
      .order('business_number')

    if (allProjectsError) {
      console.error('❌ 全プロジェクト取得エラー:', allProjectsError)
    } else {
      allProjects.forEach((p, index) => {
        console.log(`${index + 1}. ${p.business_number} - ${p.name} (${p.client_name || '未設定'})`)
      })
    }

    // 全てのクライアントを表示
    console.log('\n📋 全クライアント一覧:')
    const { data: allClients, error: allClientsError } = await supabase
      .from('clients')
      .select('*')
      .order('name')

    if (allClientsError) {
      console.error('❌ 全クライアント取得エラー:', allClientsError)
    } else {
      allClients.forEach((c, index) => {
        console.log(`${index + 1}. ${c.name} - ${c.payment_cycle_type || '未設定'} - ${c.payment_cycle_description || ''}`);
      })
    }

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

checkE04_002()



