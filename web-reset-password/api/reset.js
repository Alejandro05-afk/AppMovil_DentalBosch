const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'template.html'), 'utf8');

  const supabaseUrl = process.env.SUPABASE_URL || 'https://tywtbcivxdjvvegbxudj.supabase.co';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_dzOF4Z7JyojPTQSN9xXp6Q_TpF-0dh8';

  const output = html
    .replaceAll('{{SUPABASE_URL}}', supabaseUrl)
    .replaceAll('{{SUPABASE_ANON_KEY}}', supabaseAnonKey);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(output);
};
