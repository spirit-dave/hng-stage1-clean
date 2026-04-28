import supabase from "../../lib/supabase.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { id } = req.query;

  try {
    // GET single profile
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          status: "error",
          message: "Profile not found",
        });
      }

      return res.status(200).json({
        status: "success",
        data,
      });
    }

    // DELETE profile
    if (req.method === "DELETE") {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", id);

      if (error) {
        return res.status(404).json({
          status: "error",
          message: "Profile not found",
        });
      }

      return res.status(204).end();
    }

    // METHOD NOT ALLOWED
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