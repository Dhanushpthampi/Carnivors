export default function Footer() {
  return (
    <footer className="bg-gray-100 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
        <p>© {new Date().getFullYear()} CARNIVORS. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <a href="#" className="hover:text-red-600">Privacy</a>
          <a href="#" className="hover:text-red-600">Terms</a>
          <a href="#" className="hover:text-red-600">Support</a>
        </div>
      </div>
    </footer>
  );
}
