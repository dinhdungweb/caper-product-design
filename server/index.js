const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));

// Ensure uploads directory exists - Use absolute path resolution
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Mock MongoDB Design Schema
const MockDesign = {
  save: async function(data) {
    const id = Date.now().toString();
    // Simulate DB save operation
    return { ...data, _id: id };
  }
};

// Routes
app.post('/api/designs', async (req, res) => {
  try {
    const { views, viewPreviews, viewTechniques, totalPrice, options } = req.body;
    
    if (!viewPreviews || typeof viewPreviews !== 'object') {
        throw new Error('viewPreviews is missing or invalid');
    }

    const savedPreviews = {};
    const timestamp = Date.now();

    // Save each view's preview image safely
    for (const [viewId, previewData] of Object.entries(viewPreviews)) {
        if (previewData && typeof previewData === 'string' && previewData.includes('base64,')) {
            try {
                const fileName = `design_${viewId}_${timestamp}.png`;
                const filePath = path.join(uploadsDir, fileName);
                
                // Better base64 extraction: split by comma to get the data part
                const base64Data = previewData.split(',')[1];
                if (!base64Data) throw new Error(`Invalid base64 data for ${viewId}`);
                
                fs.writeFileSync(filePath, base64Data, 'base64');
                savedPreviews[viewId] = `/uploads/${fileName}`;
            } catch (err) {
                console.error(`Error saving image for ${viewId}:`, err);
            }
        }
    }

    const newDesign = {
      views,
      previewUrls: savedPreviews,
      viewTechniques,
      totalPrice,
      options,
      createdAt: new Date()
    };

    const savedDesign = await MockDesign.save(newDesign);
    
    res.status(201).json({
      success: true,
      design_id: savedDesign._id,
      preview_urls: savedPreviews
    });
  } catch (error) {
    console.error('CRITICAL ERROR saving design:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message,
      stack: error.stack 
    });
  }
});

app.get('/api/designs/:id', (req, res) => {
    // In real app: find by ID
    res.json({ success: true, message: 'Design data retrieved' });
});

// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
