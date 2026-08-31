const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { PDFParse } = require('pdf-parse');
const axios = require('axios');

async function pdfParse(pdfBuffer) {
  const u8 = new Uint8Array(pdfBuffer);
  const parser = new PDFParse(u8);
  await parser.load();
  const result = await parser.getText();
  const text = result.pages ? result.pages.map(page => page.text).join('\n') : '';
  return { text };
}

// Load environment variables
dotenv.config();

const CV = require('./models/CV');
const Campaign = require('./models/Campaign');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart_cv_filter';
const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const bulkCvsDir = path.join(__dirname, 'bulk-cvs');
const uploadsDir = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Check arguments for campaign ID
const targetCampaignId = process.argv[2];

// List of common skills to match and extract
const SKILLS_LIST = [
  'python', 'javascript', 'typescript', 'java', 'react', 'angular', 'vue', 'node.js', 'node', 
  'express', 'nest.js', 'spring boot', 'spring', 'flask', 'django', 'php', 'laravel', 'c++', 'c#', 'dotnet', 'asp.net',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'cicd', 'jenkins', 'git', 'github', 
  'mongodb', 'mysql', 'postgresql', 'oracle', 'sql', 'sqlite', 'redis', 'elasticsearch',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch', 'keras',
  'flutter', 'react native', 'kotlin', 'swift', 'ios', 'android', 'dart',
  'scrum', 'agile', 'project management', 'jira', 'figma'
];

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // 1. Resolve target campaign
    let campaign;
    if (targetCampaignId) {
      if (mongoose.Types.ObjectId.isValid(targetCampaignId)) {
        campaign = await Campaign.findById(targetCampaignId);
      }
      if (!campaign) {
        console.error(`Error: Campaign with ID "${targetCampaignId}" not found.`);
        process.exit(1);
      }
    } else {
      // Pick the latest active campaign
      campaign = await Campaign.findOne({ isActive: true }).sort({ createdAt: -1 });
      if (!campaign) {
        console.error('Error: No active campaign found to assign CVs to. Please specify a campaign ID as an argument: node bulk-import.js <campaign_id>');
        console.log('\nAll campaigns:');
        const allCampaigns = await Campaign.find();
        allCampaigns.forEach(c => {
          console.log(`- ID: ${c._id} | Position: "${c.position}" | Active: ${c.isActive}`);
        });
        process.exit(1);
      }
    }

    console.log(`\nImporting CVs into Campaign:`);
    console.log(`- ID:       ${campaign._id}`);
    console.log(`- Position: ${campaign.position}`);
    console.log(`- Slug:     ${campaign.slug}`);
    console.log('--------------------------------------------------\n');

    // 2. Read PDF files from bulk-cvs folder
    if (!fs.existsSync(bulkCvsDir)) {
      console.error(`Error: Dir ${bulkCvsDir} does not exist.`);
      process.exit(1);
    }

    const files = fs.readdirSync(bulkCvsDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    if (files.length === 0) {
      console.log('No PDF files found in bulk-cvs folder.');
      process.exit(0);
    }

    console.log(`Found ${files.length} pdf files to import.`);

    let importedCount = 0;

    for (const filename of files) {
      const filePath = path.join(bulkCvsDir, filename);
      console.log(`\nProcessing: "${filename}"...`);

      try {
        // A. Read and parse PDF
        const dataBuffer = fs.readFileSync(filePath);
        const parsed = await pdfParse(dataBuffer);
        const text = parsed.text || '';
        
        if (!text.trim()) {
          console.warn(`[Warning] No text extracted from "${filename}". It might be scanned/image-only.`);
        }

        // B. Copy CV file to uploads folder with unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const newFilename = `cv-${uniqueSuffix}.pdf`;
        const destPath = path.join(uploadsDir, newFilename);
        
        fs.copyFileSync(filePath, destPath);
        const stats = fs.statSync(destPath);

        // C. Extract Details from plain text
        // Name
        const nameWithoutExt = path.basename(filename, '.pdf');
        // Convert AkalankaPerera or Akalanka_Perera to Akalanka Perera
        const fullName = nameWithoutExt
          .replace(/[-_]/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .replace(/\s+/g, ' ');

        // Email regex
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const email = emailMatch ? emailMatch[0].toLowerCase() : `${nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;

        // Phone regex
        const phoneMatch = text.match(/[\d\-\+\(\)\s]{8,15}/);
        let phone = '077 123 4567'; // Default Sri Lankan format
        if (phoneMatch) {
          const cleanedPhone = phoneMatch[0].replace(/\s+/g, ' ').trim();
          if (cleanedPhone.length >= 9) phone = cleanedPhone;
        }

        // Address
        let address = 'Colombo, Sri Lanka';
        if (text.toLowerCase().includes('kandy')) address = 'Kandy, Sri Lanka';
        else if (text.toLowerCase().includes('galle')) address = 'Galle, Sri Lanka';
        else if (text.toLowerCase().includes('negombo')) address = 'Negombo, Sri Lanka';
        else if (text.toLowerCase().includes('jaffna')) address = 'Jaffna, Sri Lanka';

        // Educational details
        let educationalInstitute = 'Not Specified';
        let degree = 'Not Specified';
        let graduationYear = '2025';

        // Simple heuristic extraction for Education
        if (text.toLowerCase().includes('kiu')) educationalInstitute = 'KIU Sri Lanka';
        else if (text.toLowerCase().includes('sliit')) educationalInstitute = 'SLIIT';
        else if (text.toLowerCase().includes('moratuwa')) educationalInstitute = 'University of Moratuwa';
        else if (text.toLowerCase().includes('ucsc') || text.toLowerCase().includes('colombo')) educationalInstitute = 'University of Colombo';
        else if (text.toLowerCase().includes('apiit')) educationalInstitute = 'APIIT';
        else if (text.toLowerCase().includes('iit')) educationalInstitute = 'IIT';
        
        const degreeMatch = text.match(/(BSc|B\.Sc\.|MSc|M\.Sc\.|Bachelor|Master|Diploma|Associate)\s+([A-Za-z\s]{3,30})/i);
        if (degreeMatch) {
          degree = degreeMatch[0].trim();
        }

        // Extract skills
        const foundSkills = [];
        const lowerText = text.toLowerCase();
        for (const skill of SKILLS_LIST) {
          const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(?:^|[^a-zA-Z0-9+#])${escaped}(?:$|[^a-zA-Z0-9+#])`, 'i');
          if (regex.test(lowerText)) {
            // Capitalize skill logically
            if (skill === 'aws') foundSkills.push('AWS');
            else if (skill === 'sql') foundSkills.push('SQL');
            else if (skill === 'php') foundSkills.push('PHP');
            else if (skill === 'html') foundSkills.push('HTML');
            else if (skill === 'css') foundSkills.push('CSS');
            else if (skill === 'gui') foundSkills.push('GUI');
            else if (skill === 'nlp') foundSkills.push('NLP');
            else if (skill === 'api') foundSkills.push('API');
            else if (skill === 'ci/cd' || skill === 'cicd') foundSkills.push('CI/CD');
            else foundSkills.push(skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
          }
        }
        
        const skillsObj = foundSkills.length > 0 ? foundSkills : ['Software Engineering'];

        // D. Create CV entry data
        const cvData = {
          campaign: campaign._id,
          fullName,
          gender: 'Prefer not to say',
          address,
          email,
          phone,
          educationalInstitute,
          degree,
          graduationYear,
          skills: skillsObj,
          whyHireYou: `Bulk imported candidate CV from ${filename}. Enthusiastic professional skilled in backend, frontend work and systems.`,
          cvFile: {
            originalName: filename,
            filename: newFilename,
            size: stats.size,
            mimetype: 'application/pdf'
          },
          pdfText: text,
          status: 'new'
        };

        // E. Save to Mongoose
        const cvDoc = await CV.create(cvData);
        importedCount++;

        // F. Generate Embedding (calls FastAPI if running)
        try {
          console.log(`[Embed] Requesting embedding for: ${fullName}...`);
          const response = await axios.post(`${AI_URL}/embed`, { text: cvDoc.skillsText }, { timeout: 3000 });
          await CV.findByIdAndUpdate(cvDoc._id, { embedding: response.data.embedding });
          console.log(`[Embed] Generated and saved embedding successfully.`);
        } catch (embedErr) {
          console.warn(`[Warning] Embedding generation failed: ${embedErr.message}. Make sure your Python AI-service (FastAPI) is running at ${AI_URL}. If not, you can run "npm run dev" AI service or use the "Re-index PDFs" function later.`);
        }

      } catch (fileErr) {
        console.error(`Error processing file "${filename}":`, fileErr);
      }
    }

    // Update campaign application count
    if (importedCount > 0) {
      await Campaign.findByIdAndUpdate(campaign._id, { $inc: { applicationCount: importedCount } });
    }

    console.log(`\n==================================================`);
    console.log(`SUCCESSFUL IMPORT: ${importedCount} CVs imported into "${campaign.position}".`);
    console.log(`==================================================`);

  } catch (err) {
    console.error('Fatal run error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

run();
