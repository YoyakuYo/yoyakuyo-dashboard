"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../lib/supabase");
const router = (0, express_1.Router)();
// GET /clients -> list all customers
router.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data, error } = yield supabase_1.supabase.from("customers").select("*");
        if (error) {
            console.error('Error fetching clients:', error);
            // Return empty array to prevent frontend .map() errors
            return res.status(200).json([]);
        }
        // Ensure we always return an array
        return res.json(Array.isArray(data) ? data : []);
    }
    catch (e) {
        console.error('Error during fetching clients:', e);
        // Return empty array to prevent frontend crashes
        return res.status(200).json([]);
    }
}));
// POST /clients -> create a customer
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { first_name, last_name, phone, email } = req.body;
        const { data, error } = yield supabase_1.supabase
            .from("customers")
            .insert([{ first_name, last_name, phone, email }])
            .select("*");
        if (error)
            return res.status(500).json({ error: error.message });
        return res.status(201).json(data === null || data === void 0 ? void 0 : data[0]);
    }
    catch (e) {
        return res.status(500).json({ error: e.message });
    }
}));
// GET /clients/:id -> get a single customer
router.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { data, error } = yield supabase_1.supabase
            .from("customers")
            .select("*")
            .eq("id", id)
            .single();
        if (error)
            return res.status(404).json({ error: error.message });
        return res.json(data);
    }
    catch (e) {
        return res.status(500).json({ error: e.message });
    }
}));
exports.default = router;
