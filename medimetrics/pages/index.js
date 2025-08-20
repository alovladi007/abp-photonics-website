import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>MediMetrics - Medical Imaging AI Platform</title>
        <meta name="description" content="Enterprise medical imaging AI with HIPAA compliance" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-blue-600">MediMetrics</h1>
              </div>
              <div className="flex items-center space-x-4">
                <a href="#features" className="text-gray-700 hover:text-blue-600">Features</a>
                <a href="#pricing" className="text-gray-700 hover:text-blue-600">Pricing</a>
                <a href="#contact" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Medical Imaging AI You Can Trust
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Explainable AI for medical imaging with HIPAA-aligned controls, 
              advanced analytics, and enterprise-ready healthcare solutions.
            </p>
            <div className="flex justify-center gap-4">
              <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
                Request Demo
              </button>
              <button className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50">
                View Pricing
              </button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-3xl mb-4">🏥</div>
                <h4 className="text-lg font-semibold mb-2">Medical Imaging AI</h4>
                <p className="text-gray-600 text-sm">Advanced algorithms with Grad-CAM explainability</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-3xl mb-4">🔒</div>
                <h4 className="text-lg font-semibold mb-2">HIPAA Compliant</h4>
                <p className="text-gray-600 text-sm">Enterprise security with BAA support</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-3xl mb-4">📊</div>
                <h4 className="text-lg font-semibold mb-2">Clinical Analytics</h4>
                <p className="text-gray-600 text-sm">Real-time dashboards and reporting</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-3xl mb-4">🔗</div>
                <h4 className="text-lg font-semibold mb-2">Easy Integration</h4>
                <p className="text-gray-600 text-sm">PACS, DICOM, EHR compatibility</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-center items-center space-x-8 text-gray-500">
              <span className="font-semibold">HIPAA</span>
              <span className="font-semibold">BAA</span>
              <span className="font-semibold">SOC2</span>
              <span className="font-semibold">AWS</span>
              <span className="font-semibold">DICOM</span>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center bg-blue-600 text-white rounded-2xl p-12">
            <h3 className="text-3xl font-bold mb-4">
              Ready to Transform Your Medical Imaging?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Start with a pilot program or explore our demo environment
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Contact Sales
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8 px-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <p>© 2024 MediMetrics. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="/privacy" className="hover:text-white">Privacy</a>
              <a href="/terms" className="hover:text-white">Terms</a>
              <a href="/baa" className="hover:text-white">BAA</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}