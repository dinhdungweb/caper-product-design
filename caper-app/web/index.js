import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Setup directories
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '200mb' }));
app.use('/api/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: 'shopify-app' });
});

// Post design handler (Compatible with App Proxy or Direct)
app.post('/api/designs', (req, res) => {
    try {
        const { views, viewPreviews, viewTechniques, totalPrice, options } = req.body;
        
        if (!viewPreviews || Object.keys(viewPreviews).length === 0) {
            return res.status(400).json({ error: 'Missing design preview images' });
        }

        const design_id = `DESIGN-${Date.now()}`;
        const savedPreviews = {};

        // Save binary images
        for (const [viewKey, base64Data] of Object.entries(viewPreviews)) {
            if (!base64Data) continue;
            
            // Clean base64
            const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
            const fileName = `${design_id}-${viewKey}.png`;
            const filePath = path.join(uploadsDir, fileName);
            
            fs.writeFileSync(filePath, cleanBase64, 'base64');
            savedPreviews[viewKey] = `/api/uploads/${fileName}`;
        }

        // Final response
        res.status(201).json({
            success: true,
            design_id: design_id,
            total_price: totalPrice,
            previews: savedPreviews
        });

    } catch (error) {
        console.error('SERVER ERROR:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`SHOPIFY APP BACKEND RUNNING ON PORT ${PORT}`);
    console.log(`API URL: http://localhost:${PORT}/api`);
    console.log(`========================================\n`);
});
