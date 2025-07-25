import Header from './Header';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <Header />
      <main className="min-h-[80vh] ">
        <Outlet />  {/* Content will be injected here */}
      </main>
      <Footer />
    </>
  );
}
