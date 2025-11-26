
import { Button } from "@/components/ui/button";
import { IkmLogo } from "@/components/icons";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 sm:p-6 flex justify-between items-center border-b">
        <IkmLogo className="w-auto h-8" />
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Seller Login</Button>
          </Link>
          <Link href="/#stores">
            <Button>View Stores</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="flex flex-col items-center justify-center text-center py-20 sm:py-32 px-4 bg-primary/5">
            <h1 className="text-4xl sm:text-6xl font-bold font-headline max-w-4xl">
              Your Own Branded Store, Secured by IKM
            </h1>
            <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl">
              Create a beautiful online store in minutes. We handle secure payments, so you can focus on selling and delivering your products.
            </p>
            <div className="mt-8 flex gap-4">
               <Link href="/login">
                <Button size="lg">Create Your Store</Button>
               </Link>
               <Link href="/#stores">
                <Button size="lg" variant="outline">Browse Stores</Button>
               </Link>
            </div>
        </section>
        <section id="stores" className="py-20 sm:py-24 px-4">
            <h2 className="text-3xl sm:text-4xl font-bold font-headline text-center">Featured Stores</h2>
            <p className="mt-2 text-muted-foreground text-center max-w-xl mx-auto">Discover unique products from our network of trusted sellers.</p>
            <div className="mt-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Placeholder for store cards */}
              <div className="border rounded-lg p-6 text-center">
                <p className="font-bold font-headline text-xl">Mary's Store</p>
                <p className="text-muted-foreground text-sm mt-1">Handmade Jewelry & Crafts</p>
                 <Link href="#">
                    <Button variant="secondary" className="mt-4">Visit Store</Button>
                </Link>
              </div>
               <div className="border rounded-lg p-6 text-center">
                <p className="font-bold font-headline text-xl">Amina's Creations</p>
                <p className="text-muted-foreground text-sm mt-1">Custom Fashion & Apparel</p>
                 <Link href="#">
                    <Button variant="secondary" className="mt-4">Visit Store</Button>
                </Link>
              </div>
               <div className="border rounded-lg p-6 text-center">
                <p className="font-bold font-headline text-xl">KicksRepublic</p>
                <p className="text-muted-foreground text-sm mt-1">The Best Sneakers in Town</p>
                <Link href="#">
                    <Button variant="secondary" className="mt-4">Visit Store</Button>
                </Link>
              </div>
            </div>
        </section>
      </main>
      <footer className="p-6 text-center text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} IKM. All rights reserved.</p>
      </footer>
    </div>
  );
}
