import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PlaceholderIndicatorProps {
  children: React.ReactNode;
  type?: 'placeholder' | 'test' | 'todo' | 'not-implemented';
  description?: string;
  className?: string;
}
export function PlaceholderIndicator({ 
  children, 
  type = 'placeholder', 
  description, 
  className 
}: PlaceholderIndicatorProps) {
  const typeLabels = {
    placeholder: '(placeholder)',
    test: '(test value)',
    todo: '(TODO)',
    'not-implemented': '(not implemented)'
  };
  const typeColors = {
    placeholder: 'text-gray-500',
    test: 'text-blue-500',
    todo: 'text-orange-500',
    'not-implemented': 'text-red-500'
  return (
    <TooltipProvider>
      <div className={cn("inline-flex items-center gap-2", className)}>
        <span>{children}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("text-xs italic font-normal", typeColors[type])}>
              {typeLabels[type]}
              <Info className="inline ml-1 h-3 w-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{description || `This is ${type} data and may not be persisted.`}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
