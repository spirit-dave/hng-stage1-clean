import axios from "axios";
import supabase from "../../lib/supabase.js";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // =========================
    // GET ALL PROFILES
    // =========================
    if (req.method === "GET") {
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
    }

    // =========================
    // CREATE PROFILE (POST)
    // =========================
    if (req.method === "POST") {
      const { name } = req.body;

      if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({
          status: "error",
          message: "Missing or invalid name",
        });
      }

      const cleanName = name.toLowerCase();

      // Check duplicate
      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("name", cleanName)
        .single();

      if (existing) {
        return res.status(200).json({
          status: "success",
          message: "Profile already exists",
          data: existing,
        });
      }

      // Call APIs
      const [g, a, n] = await Promise.all([
        axios.get(`https://api.genderize.io?name=${cleanName}`),
        axios.get(`https://api.agify.io?name=${cleanName}`),
        axios.get(`https://api.nationalize.io?name=${cleanName}`),
      ]);

      const { gender, probability, count } = g.data;
      const { age } = a.data;
      const { country } = n.data;

      if (!gender || count === 0) {
        return res.status(502).json({
          status: "error",
          message: "Genderize returned an invalid response",
        });
      }

      if (age === null) {
        return res.status(502).json({
          status: "error",
          message: "Agify returned an invalid response",
        });
      }

      if (!country || country.length === 0) {
        return res.status(502).json({
          status: "error",
          message: "Nationalize returned an invalid response",
        });
      }

      let age_group;
      if (age <= 12) age_group = "child";
      else if (age <= 19) age_group = "teenager";
      else if (age <= 59) age_group = "adult";
      else age_group = "senior";

      const topCountry = country.sort(
        (a, b) => b.probability - a.probability
      )[0];

      const newProfile = {
        id: uuidv4(),
        name: cleanName,
        gender,
        gender_probability: Number(probability),
        sample_size: Number(count),
        age,
        age_group,
        country_id: topCountry.country_id,
        country_probability: topCountry.probability,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          status: "error",
          message: error.message,
        });
      }

      return res.status(201).json({
        status: "success",
        data,
      });
    }

    // =========================
    // METHOD NOT ALLOWED
    // =========================
    return res.status(405).json({
      status: "error",
      message: "Method not allowed",
    });

  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
}