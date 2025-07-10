'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, HelpCircle } from 'lucide-react';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from './ui/scroll-area';

// Define o tipo para os componentes de ícone da Lucide
type LucideIcon = React.ForwardRefExoticComponent<Omit<Icons.LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;

// Lista de ícones disponíveis por nome (adicione mais, se necessário)
export const iconList = [
    "Package", "Cog", "Hourglass", "Wrench", "PackageCheck", "Truck", "ShieldCheck", 
    "FileText", "Server", "HardDrive", "Laptop", "Smartphone", "ClipboardList", 
    "FlaskConical", "CircleHelp", "LayoutDashboard", "Users", "Mail", "Bell",
    "AlertTriangle", "Archive", "BadgeCheck", "BatteryCharging", "Book", "Briefcase",
    "Bug", "Building", "Calendar", "Camera", "CircuitBoard", "Clipboard", "Cloud",
    "Code", "Compass", "Cpu", "CreditCard", "Database", "Download", "DraftingCompass",
    "Droplet", "ExternalLink", "Feather", "File", "Filter", "Flag", "Folder",
    "Gift", "Globe", "Home", "Image", "Inbox", "Key", "Lightbulb", "Link",
    "Lock", "Map", "Medal", "MessageSquare", "Mic", "Monitor", "MousePointer",
    "Paperclip", "Pause", "PenTool", "Phone", "PieChart", "Play", "Plug",
    "Printer", "QrCode", "Recycle", "Rocket", "Save", "Scale", "Scissors",
    "ScreenShare", "Send", "Settings", "Share2", "ShoppingCart", "Sidebar",
    "Signal", "Star", "Tag", "Target", "ToggleLeft", "ToggleRight", "Tool",
    "Trash2", "TrendingUp", "Umbrella", "Unlock", "Upload", "Video", "Wallet",
    "Wifi", "Wind", "Zap", "ZoomIn", "ZoomOut"
] as const;

export type IconName = typeof iconList[number];

// Mapeamento de nomes de ícones para seus componentes
const iconComponents = Object.fromEntries(
  Object.entries(Icons).filter(([key]) => iconList.includes(key as any))
) as Record<IconName, LucideIcon>;

// Função auxiliar para renderizar um ícone pelo nome
export const renderIcon = (iconName?: string): React.ReactNode => {
  if (!iconName || !isIconName(iconName)) {
    return <HelpCircle className="h-4 w-4" />;
  }
  const IconComponent = iconComponents[iconName];
  return <IconComponent className="h-4 w-4" />;
};

// Type guard para verificar se uma string é um nome de ícone válido
export function isIconName(name: string): name is IconName {
  return iconList.includes(name as any);
}

interface IconPickerProps {
  value?: string;
  onChange: (value: IconName) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);

  const SelectedIcon = value && isIconName(value) ? iconComponents[value] : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <div className="flex items-center gap-2">
            {SelectedIcon ? <SelectedIcon className="h-4 w-4" /> : null}
            {value || 'Selecione um ícone'}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar ícone..." />
          <CommandEmpty>Nenhum ícone encontrado.</CommandEmpty>
          <CommandList>
            <ScrollArea className="h-64">
              <CommandGroup>
                {iconList.map((iconName) => {
                  const Icon = iconComponents[iconName];
                  return (
                    <CommandItem
                      key={iconName}
                      value={iconName}
                      onSelect={(currentValue: string) => {
                        const selectedIconName = iconList.find(name => name.toLowerCase() === currentValue.toLowerCase());
                         if(selectedIconName) {
                            onChange(selectedIconName);
                        }
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === iconName ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex items-center gap-2">
                         {Icon ? <Icon className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
                         {iconName}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
