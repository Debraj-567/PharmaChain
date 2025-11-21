import React from 'react';
import { LifecycleEvent } from '../types';
import { Check, Truck, Factory, Building } from 'lucide-react';

interface TimelineProps {
  events: LifecycleEvent[];
}

const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const getIcon = (action: string) => {
    if (action.includes('Manufacturer') || action.includes('Registered')) return <Factory className="w-4 h-4 text-white" />;
    if (action.includes('Shipment') || action.includes('Distributor')) return <Truck className="w-4 h-4 text-white" />;
    if (action.includes('Pharmacy')) return <Building className="w-4 h-4 text-white" />;
    return <Check className="w-4 h-4 text-white" />;
  };

  return (
    <div className="relative pl-4 py-2">
      <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-200 -z-10"></div>
      <div className="space-y-6">
        {events.map((event, index) => (
          <div key={index} className="flex items-start gap-4">
            <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-teal-600 ring-4 ring-white shadow-sm">
              {getIcon(event.action)}
            </div>
            <div className="flex-1 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-900">{event.action}</h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-mono">
                  {new Date(event.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                <span className="font-medium text-gray-700">{event.actor}</span> 
                <span className="text-gray-400">•</span> 
                {event.location}
              </p>
              <div className="mt-2 text-xs text-gray-400 font-mono truncate max-w-[200px]">
                Tx: {event.txHash}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
