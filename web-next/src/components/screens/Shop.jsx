import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { ParkedScreen } from "../Primitives";
import { Button } from "../ui/Button";

// Mock catalogue -- no marketplace backend exists yet, and per the
// ecosystem docs YOU's shop and Kronk's marketplace are separate systems
// with some crossover items, not one merged store. Cart is local/visual
// only -- no real commerce here.
const MOCK_PRODUCTS = [
  { name: "YOU Journal", price: "$24" },
  { name: "Seed Being print", price: "$18" },
  { name: "Grounding candle", price: "$16" },
  { name: "Values card deck", price: "$22" }
];

export default function Shop() {
  const [cart, setCart] = useState([]);

  return (
    <ParkedScreen title="Shop" note="future — design direction only">
      <div className="grid grid-cols-2 gap-3">
        {MOCK_PRODUCTS.map(p => (
          <div key={p.name} className="rounded-card bg-surface1 shadow-card p-3.5">
            <div className="w-full aspect-square rounded-sm bg-surface3 mb-2.5 flex items-center justify-center">
              <ShoppingBag size={22} strokeWidth={1.5} className="text-textMuted" />
            </div>
            <div className="text-bodySm font-medium text-textPrimary">{p.name}</div>
            <div className="text-caption text-textMuted mb-2">{p.price}</div>
            <Button
              variant={cart.includes(p.name) ? "secondary" : "primary"}
              size="sm"
              className="w-full"
              onClick={() => setCart(prev => (prev.includes(p.name) ? prev : [...prev, p.name]))}
            >
              {cart.includes(p.name) ? "In cart" : "Add to cart"}
            </Button>
          </div>
        ))}
      </div>
    </ParkedScreen>
  );
}
