import supabase from '../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      return res.status(500).json({
        status: "error",
        message: error.message
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
}