import { useState } from "react";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ColorOption {
  name: string;
  hsl: string;
  hslDark: string; // Darker variant for gradients
  preview: string; // For visual display
}

const colorOptions: ColorOption[] = [
  { name: "Cyan", hsl: "190 95% 50%", hslDark: "190 80% 40%", preview: "hsl(190, 95%, 50%)" },
  { name: "Purple", hsl: "270 95% 60%", hslDark: "270 80% 45%", preview: "hsl(270, 95%, 60%)" },
  { name: "Pink", hsl: "330 90% 60%", hslDark: "330 75% 45%", preview: "hsl(330, 90%, 60%)" },
  { name: "Green", hsl: "150 80% 45%", hslDark: "150 70% 35%", preview: "hsl(150, 80%, 45%)" },
  { name: "Orange", hsl: "25 95% 55%", hslDark: "25 85% 42%", preview: "hsl(25, 95%, 55%)" },
  { name: "Blue", hsl: "220 90% 55%", hslDark: "220 80% 42%", preview: "hsl(220, 90%, 55%)" },
  { name: "Red", hsl: "0 85% 55%", hslDark: "0 75% 42%", preview: "hsl(0, 85%, 55%)" },
  { name: "Yellow", hsl: "45 95% 55%", hslDark: "45 85% 42%", preview: "hsl(45, 95%, 55%)" },
];

export function ColorPicker() {
  const [selectedColor, setSelectedColor] = useState<string>("Cyan");
  const [open, setOpen] = useState(false);

  const applyColor = (color: ColorOption) => {
    setSelectedColor(color.name);
    // Our app applies `.dark` to a page wrapper, and that wrapper defines the CSS variables.
    // So we must set the variables on the same element (inline styles win).
    const themeRoot = (document.querySelector(".dark") as HTMLElement | null) ??
      document.documentElement;

    themeRoot.style.setProperty("--primary", color.hsl);
    themeRoot.style.setProperty("--primary-dark", color.hslDark);
    themeRoot.style.setProperty("--ring", color.hsl);
    setOpen(false);
  };

  const currentColor = colorOptions.find((c) => c.name === selectedColor);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
        >
          <Palette className="h-4 w-4" />
          <span
            className="absolute bottom-1 right-1 h-2 w-2 rounded-full ring-1 ring-background"
            style={{ backgroundColor: currentColor?.preview }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="end">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Theme Color
          </p>
          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.name}
                onClick={() => applyColor(color)}
                className={cn(
                  "h-8 w-8 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
                  selectedColor === color.name && "ring-2 ring-foreground scale-110"
                )}
                style={{ backgroundColor: color.preview }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
