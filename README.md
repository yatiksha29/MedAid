# MedAid — Medical Aid & Donation Platform

🔗 **Live Demo:** [medaid-87ym.onrender.com](https://medaid-87ym.onrender.com)

MedAid is a full-stack web platform that connects medicine and medical
equipment donors with NGOs and people in need, making healthcare
resources more accessible and reducing medical waste.

## Why I Built This

A lot of medicines sitting at home go unused — they expire before
we ever need them and end up thrown away instead of helping someone
who could actually use them. The same goes for medical equipment:
people often buy things like wheelchairs or oxygen concentrators for
a specific situation, and once that need passes, the equipment sits
unused. MedAid was built to close that gap — letting unused medicines
and equipment reach people or NGOs who need them, often at little to
no cost, since not everyone can afford full-price healthcare
essentials. It's a small way to reduce waste while making healthcare
support more accessible to those who need it most.

## Features

- **Three user roles** — Donor, NGO, and Needy — each with a tailored
  sign-up flow and dashboard.
- **Donate Medicines** — donors can list unused medicines for others
  to request.
- **Lend Equipment** — wheelchairs, walkers, oxygen concentrators, and
  other medical equipment can be listed for lending.
- **Request Support** — NGOs and needy individuals can search and
  request available medicines/equipment.
- **AI-powered Aadhaar auto-fill** — using the Google Gemini API,
  uploading an Aadhaar card during Needy profile creation
  automatically extracts and fills in the required identity fields.
- **Image uploads** — medicine and equipment photos are stored via
  Cloudinary for reliable cloud-based image hosting.
- **Authentication** — secure login/signup for all user types.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript, Bootstrap, AJAX/jQuery |
| Backend | Node.js, Express.js |
| Database | MySQL (hosted on Aiven) |
| Image Storage | Cloudinary |
| AI Integration | Google Gemini API (document data extraction) |
| Deployment | Render |

## How It Works

1. **Register** as a Donor, NGO, or Needy individual.
2. **Donate or Search** — donors list medicines/equipment; NGOs and
   needy users search and request what they need.
3. **Connect** — the platform connects donors directly with NGOs/needy
   individuals.
4. **Help** — completed requests turn surplus medical resources into
   real support for people who need them.

## Getting Started (Local Setup)

```bash
git clone https://github.com/yatiksha29/MedAid.git
cd MedAid
npm install
node server.js
```

Set up a `.env` file with your MySQL, Cloudinary, and Gemini API
credentials before running locally.

## Developer

**Yatiksha Goyal** — MCA (AI/ML), Chandigarh University
[LinkedIn](https://linkedin.com/in/yatiksha-goyal-74ab29302) · [GitHub](https://github.com/yatiksha29)
