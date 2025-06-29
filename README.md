# 🧹 Scheduler Data Cleaner

A powerful, AI-driven data cleaning and validation tool built for scheduler data management. Transform messy CSV/XLSX files into clean, validated datasets with natural language processing and intelligent recommendations.


### 🔄 **Data Ingestion & Processing**
- **Multi-file upload** with drag-and-drop support
- **CSV & XLSX** file format support
- **Real-time parsing** and validation
- **Synthetic dataset** generation for testing

### 🛡️ **Advanced Validation System**
- **8+ validation rules** for data quality assurance
- **Custom rule builder** with visual interface
- **Inline editing** capabilities with instant feedback
- **Priority-based rule weighting** system

### 🤖 **AI-Powered Features**
- **Natural Language → Rules** converter
- **AI Rule Recommendations** based on data analysis
- **Natural Language Data Modification** commands
- **Intelligent error correction** suggestions

### 📊 **Data Visualization & Management**
- **Interactive data grids** with sorting and filtering
- **Real-time validation feedback** with color coding
- **Progress dashboards** and analytics
- **Bulk data export** (CSV + Rules JSON)

### 🔍 **Smart Search & Query**
- **Natural language queries** for data exploration
- **Advanced filtering** across multiple datasets
- **Auto-fix suggestions** for common data issues

## 🚀 Tech Stack

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS  
**State Management:** Zustand with shallow comparison  
**AI Integration:** Cohere API with fallback pattern matching  
**File Processing:** PapaParse (CSV), XLSX.js (Excel)  
**Deployment:** Vercel with GitHub Actions CI/CD  
**Data Validation:** Custom Zod-based schemas

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RitamPal26/data_alchemist.git
   cd scheduler-data-cleaner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Add your Cohere API key:
   ```
   COHERE_API_KEY=your_cohere_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📸 Screenshots

<img width="886" alt="image" src="https://github.com/user-attachments/assets/4f51b6f5-6d50-4ac8-a296-b0e1e32cd766" />
<img width="875" alt="image" src="https://github.com/user-attachments/assets/2fc52f72-143e-4f5d-9a9a-5a8ac88e21c0" />
<img width="866" alt="image" src="https://github.com/user-attachments/assets/802f43a6-cfa4-428b-ad02-c9d5485921dd" />
<img width="859" alt="image" src="https://github.com/user-attachments/assets/a73e1dd5-c9fd-4241-a0a1-625e7f456e42" />



### Main Dashboard

*
## 🧪 Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting & Type Checking
```bash
npm run lint
npm run type-check
```

## 🏗️ Architecture

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes for AI features
│   └── page.tsx        # Main application page
├── components/         # React components
│   ├── DataGrid.tsx    # Interactive data table
│   ├── RuleBuilder.tsx # Visual rule creation
│   └── ...
├── lib/                # Utilities and configuration
│   ├── store.ts        # Zustand state management
│   ├── schemas.ts      # Validation schemas
│   └── cohere.ts       # AI API client
└── hooks/              # Custom React hooks
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cohere AI** for natural language processing capabilities
- **Vercel** for seamless deployment and hosting
- **Open source community** for the amazing tools and libraries

## 📞 Support

For support, email your-email@example.com or create an issue on GitHub.

**Made with ❤️ by Ritam Pal | 

