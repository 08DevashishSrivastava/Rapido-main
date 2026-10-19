import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Card className="text-center max-w-md py-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900">404 - Destination Not Found</h1>
          <p className="text-xs text-slate-500">
            The page or route you are looking for does not exist on RidePass Pro.
          </p>
        </div>
        <div className="pt-2">
          <Link to="/">
            <Button size="sm" variant="primary" className="flex items-center gap-1.5 mx-auto">
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Safety</span>
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
