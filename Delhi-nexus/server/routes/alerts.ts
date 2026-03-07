import { Router } from "express";
import { getAlerts } from "../services/alertEngine";

const router = Router();

router.get("/api/alerts", (req, res) => {

  res.json(getAlerts());

});

export default router;