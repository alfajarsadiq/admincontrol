// File: Sidebar.tsx

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  FileText,
  Users,
  Send,
  BarChart3,
  ChevronLeft,
  ClipboardList,
  ShoppingCart,
  PackagePlus,
  UserPlus, 
  Receipt,
  // 🔥 IMPORT THE NEW ICON
  Search,
  // 🔥 NEW IMPORT: FileSpreadsheet is a better icon for Excel Reports
  FileSpreadsheet, 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// FIX: Added 'standard' role to ensure correct type checking and logic
type UserRole = 'admin' | 'lr_user' | 'standard' | 'all'; 

interface NavItem {
    title: string;
    path: string;
    icon: React.ElementType;
    role?: UserRole; 
}

const navItems: NavItem[] = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, role: 'admin' }, 
  { title: "Reports", path: "/campaign-reports", icon: BarChart3, role: 'admin' },
  
  // 🔥 NEW ITEM: Monthly Order Reports - ONLY for Admin role
  { title: "Monthly Order Reports", path: "/reports/orders", icon: FileSpreadsheet, role: 'admin' }, 
  
  { title: "Settings", path: "/email-settings", icon: Settings, role: 'admin' },
  { title: "Templates", path: "/email-templates", icon: FileText, role: 'admin' },
  // FIX: These roles are tagged as lr_user, but we will allow standard users to access them via code logic below
  { title: "LR Form Generator", path: "/lr-generator", icon: ClipboardList, role: 'lr_user' }, 
  { title: "Purchase Bill Generator", path: "/invoice-generator", icon: Receipt, role: 'lr_user' }, 
  { title: "Orders", path: "/orders", icon: ShoppingCart, role: 'lr_user' },
  // 🔥 NEW ITEM: Order Status Check - accessible to standard/lr_user
  { title: "Order Status Check", path: "/order-status-check", icon: Search, role: 'lr_user' }, 
  { title: "Subscribers", path: "/subscribers", icon: Users, role: 'admin' },
  { title: "Campaigns", path: "/campaigns", icon: Send, role: 'admin' },
  { title: "Analytics", path: "/analytics", icon: BarChart3, role: 'admin' },
  { title: "Product Management", path: "/products", icon: PackagePlus, role: 'admin' },
  { title: "Salespersons", path: "/salespersons", icon: UserPlus, role: 'admin' },
  { title: "User Management", path: "/users", icon: Users, role: 'admin' }, 
];

const textVariants = {
  hidden: { opacity: 0, x: -20, transition: { duration: 0.2 } },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1 } },
};

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const { admin } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    if (!admin) return false;

    if (!item.role || item.role === 'all') {
      return true;
    }

    // Admins see everything, including the new report link
    if (admin.role === 'admin') {
       return true;
    }
    
    // FIX: Allow both 'lr_user' and 'standard' users to see the 'lr_user' pages
    const isLrOrStandard = admin.role === 'lr_user' || admin.role === 'standard';
    
    if (isLrOrStandard) {
        // These roles see Order/LR links, including the new status check
        return item.role === 'lr_user'; 
    }

    return false; // Default deny
  });

  return (
    <aside className={cn("bg-card border-r border-border transition-[width] duration-300 ease-in-out flex flex-col relative", collapsed ? "w-20" : "w-64")}>
      <div className="h-16 flex items-center justify-center px-4 border-b border-border">
        <AnimatePresence>
          {!collapsed ? (
            <motion.div initial="hidden" animate="visible" exit="hidden" variants={textVariants} className="flex items-center gap-3 overflow-hidden">
              {/* FIX: Display user name instead of companyName */}
              <span className="font-bold text-foreground whitespace-nowrap">{admin?.name || 'N/A'}</span>
            </motion.div>
          ) : (
            // FIX: Display first letter of name when collapsed
            <span className="font-bold text-xl text-foreground whitespace-nowrap">{admin?.name ? admin.name[0].toUpperCase() : 'N/A'}</span>
          )}
        </AnimatePresence>
      </div>

      <button onClick={onToggle} className={cn("absolute top-14 -right-4 z-10 p-1.5 rounded-full bg-card border border-border shadow-md transition-transform duration-300 ease-in-out hover:bg-muted", !collapsed && "rotate-180")} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>

      <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
             key={item.path}
             to={item.path}
             className={({ isActive }) => cn(
               "flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors duration-200 group relative",
               "hover:bg-muted",
               isActive ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
             )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={textVariants}
                  className="text-sm whitespace-nowrap"
                >
                  {item.title}
                </motion.span>
              )}
            </AnimatePresence>
            {collapsed && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none">
                {item.title}
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
