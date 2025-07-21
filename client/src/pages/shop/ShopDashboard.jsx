import CreateProductForm from '../../components/CreateProductForm';

export default function ShopDashboard() {
  return (
    <div className="min-h-screen flex flex-col">


      <main className="flex-grow max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6 text-center text-red-700">
          Shop Owner Dashboard
        </h1>

        <CreateProductForm />

        {/* In future you can add: */}
        {/* <ProductList /> */}
      </main>


    </div>
  );
}
