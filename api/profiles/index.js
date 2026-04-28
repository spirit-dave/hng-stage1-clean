import supabase from "../../lib/supabase.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return res.status(405).json({
      status: "error",
      message: "Method not allowed",
    });
  }

  try {
    let query = supabase.from("profiles").select("*");

    const { gender, country_id, age_group } = req.query;

    if (gender) {
      query = query.ilike("gender", gender);
    }

    if (country_id) {
      query = query.ilike("country_id", country_id);
    }

    if (age_group) {
      query = query.ilike("age_group", age_group);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({
        status: "error",
        message: error.message,
      });
    }

    return res.status(200).json({
      status: "success",
      count: data.length,
      data: data.map((item) => ({
        id: item.id,
        name: item.name,
        gender: item.gender,
        age: item.age,
        age_group: item.age_group,
        country_id: item.country_id,
      })),
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
}