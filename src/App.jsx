import { useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
    } else {
      alert('Please select a PDF file')
    }
  }

  const formatAnalysis = (text) => {
    // Headers
    text = text.replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
    text = text.replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
    text = text.replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    
    // Bold and Italic
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>') // Bold + Italic
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    
    // Lists
    text = text.replace(/^\s*[-+*]\s+(.*)/gm, '<li class="ml-4">$1</li>') // Unordered lists
    text = text.replace(/^\s*\d+\.\s+(.*)/gm, '<li class="ml-4">$1</li>') // Ordered lists
    text = text.replace(/(<li.*?>.*?<\/li>)\s*\n/g, '$1') // Group list items
    text = text.replace(/(<li.*?>.*?<\/li>)+/g, '<ul class="list-disc my-4">$&</ul>') // Wrap in ul
    
    // Code blocks
    text = text.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
    text = text.replace(/```([^`]+)```/g, '<pre class="bg-gray-100 p-3 rounded my-4"><code>$1</code></pre>')
    
    // Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>')
    
    // Blockquotes
    text = text.replace(/^\> (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 my-4 italic">$1</blockquote>')
    
    // Paragraphs and line breaks
    text = text.replace(/\n\s*\n/g, '</p><p class="my-4">') // Paragraphs
    text = text.replace(/\n/g, '<br/>') // Single line breaks
    text = '<p class="my-4">' + text + '</p>' // Wrap in initial paragraph
    
    return text
  }

  const analyzePDF = async () => {
    if (!file) {
      alert('Please select a PDF file first')
      return
    }

    setLoading(true)
    try {
      const fileText = await readPDFText(file)
      
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })

      const prompt = `Analyze this resume and provide insights using markdown formatting. Include:

# Resume Analysis

## Key Skills and Expertise
* List the main technical skills
* List soft skills
* Highlight unique capabilities

## Experience Level
* Years of experience
* Seniority level
* Industry expertise

## Areas for Improvement
1. List potential gaps
2. Missing skills for their target role
3. Certification recommendations

## Suggested Optimizations
* Format improvements
* Content suggestions
* Keywords to add

Please use markdown features like:
- **bold** for important points
- *italic* for emphasis
- \`code\` for technical terms
- ### for subsections
- > for important quotes or highlights

Resume text:
${fileText}`

      const result = await model.generateContent(prompt)
      const response = await result.response
      setAnalysis(response.text())
    } catch (error) {
      console.error('Error analyzing resume:', error)
      setAnalysis('Error analyzing resume. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const readPDFText = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result)
      }
      reader.readAsText(file)
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto max-w-4xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Resume Analyzer</h1>
        
        <div className="mb-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <button
          onClick={analyzePDF}
          disabled={!file || loading}
          className="bg-blue-500 text-white px-4 py-2 rounded
            hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Analyze Resume'}
        </button>

        {analysis && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Analysis Results:</h2>
            <div 
              className="text-gray-700 prose prose-blue max-w-none"
              dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
