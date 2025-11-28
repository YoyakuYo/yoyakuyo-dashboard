import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";

const router = Router();

// GET /clients -> list all customers
router.get("/", async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from("customers").select("*");
    if (error) {
      console.error('Error fetching clients:', error);
      // Return empty array to prevent frontend .map() errors
      return res.status(200).json([]);
    }
    // Ensure we always return an array
    return res.json(Array.isArray(data) ? data : []);
  } catch (e: any) {
    console.error('Error during fetching clients:', e);
    // Return empty array to prevent frontend crashes
    return res.status(200).json([]);
  }
});

// POST /clients -> create a customer
router.post("/", async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, phone, email } = req.body;
    const { data, error } = await supabase
      .from("customers")
      .insert([{ first_name, last_name, phone, email }])
      .select("*");
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data?.[0]);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// GET /clients/:id -> get a single customer
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();
    if (error) return res.status(404).json({ error: error.message });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
