const { supabase } = require('./utils/supabase')

exports.handler = async (event, context) => {
  try {
    const { data, error } = await supabase
      .from('your_table')
      .select('*')
    
    if (error) throw error
    
    return {
      statusCode: 200,
      body: JSON.stringify({ data })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
