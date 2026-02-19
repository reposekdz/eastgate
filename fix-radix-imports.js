const fs = require('fs');
const path = require('path');

// Map of incorrect imports to correct imports
const importMap = {
  '{ Tooltip as TooltipPrimitive } from "radix-ui"': '* as TooltipPrimitive from "@radix-ui/react-tooltip"',
  '{ Tabs as TabsPrimitive } from "radix-ui"': '* as TabsPrimitive from "@radix-ui/react-tabs"',
  '{ Switch as SwitchPrimitive } from "radix-ui"': '* as SwitchPrimitive from "@radix-ui/react-switch"',
  '{ Slider as SliderPrimitive } from "radix-ui"': '* as SliderPrimitive from "@radix-ui/react-slider"',
  '{ Dialog as SheetPrimitive } from "radix-ui"': '* as SheetPrimitive from "@radix-ui/react-dialog"',
  '{ Slot } from "radix-ui"': '{ Slot } from "@radix-ui/react-slot"',
  '{ Separator as SeparatorPrimitive } from "radix-ui"': '* as SeparatorPrimitive from "@radix-ui/react-separator"',
  '{ ScrollArea as ScrollAreaPrimitive } from "radix-ui"': '* as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"',
  '{ Select as SelectPrimitive } from "radix-ui"': '* as SelectPrimitive from "@radix-ui/react-select"',
  '{ RadioGroup as RadioGroupPrimitive } from "radix-ui"': '* as RadioGroupPrimitive from "@radix-ui/react-radio-group"',
  '{ Progress as ProgressPrimitive } from "radix-ui"': '* as ProgressPrimitive from "@radix-ui/react-progress"',
  '{ Popover as PopoverPrimitive } from "radix-ui"': '* as PopoverPrimitive from "@radix-ui/react-popover"',
  '{ DropdownMenu as DropdownMenuPrimitive } from "radix-ui"': '* as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"',
  '{ Checkbox as CheckboxPrimitive } from "radix-ui"': '* as CheckboxPrimitive from "@radix-ui/react-checkbox"',
  '{ Dialog as DialogPrimitive } from "radix-ui"': '* as DialogPrimitive from "@radix-ui/react-dialog"',
  '{ Avatar as AvatarPrimitive } from "radix-ui"': '* as AvatarPrimitive from "@radix-ui/react-avatar"',
  '{ Accordion as AccordionPrimitive } from "radix-ui"': '* as AccordionPrimitive from "@radix-ui/react-accordion"',
};

// Files to fix
const files = [
  'src/components/ui/tooltip.tsx',
  'src/components/ui/tabs.tsx',
  'src/components/ui/switch.tsx',
  'src/components/ui/slider.tsx',
  'src/components/ui/sheet.tsx',
  'src/components/ui/sidebar.tsx',
  'src/components/ui/separator.tsx',
  'src/components/ui/scroll-area.tsx',
  'src/components/ui/select.tsx',
  'src/components/ui/radio-group.tsx',
  'src/components/ui/progress.tsx',
  'src/components/ui/popover.tsx',
  'src/components/ui/dropdown-menu.tsx',
  'src/components/ui/checkbox.tsx',
  'src/components/ui/dialog.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/avatar.tsx',
  'src/components/ui/accordion.tsx',
  'src/components/ui/breadcrumb.tsx',
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace each incorrect import
    Object.entries(importMap).forEach(([incorrect, correct]) => {
      content = content.replace(incorrect, correct);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`✓ Fixed: ${file}`);
  } catch (err) {
    console.error(`✗ Error fixing ${file}:`, err.message);
  }
});

console.log('\nAll Radix UI imports fixed!');
