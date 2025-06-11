export default function Home() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="bg-blue-500 text-white p-8 rounded-lg">
        <h1 className="text-4xl font-bold mb-4">Tailwind Test</h1>
        <p className="text-xl mb-4">If this is red background with blue box, Tailwind works!</p>
        <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors">
          Green Button
        </button>
      </div>
    </div>
  )
}
