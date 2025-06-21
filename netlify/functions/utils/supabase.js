// netlify/functions/utils/supabase.js
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

exports.supabase = createClient(supabaseUrl, supabaseKey)
