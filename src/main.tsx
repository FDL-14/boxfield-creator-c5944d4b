
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { PermissionsProvider } from './hooks/usePermissions.tsx'

createRoot(document.getElementById("root")!).render(
  <PermissionsProvider>
    <App />
  </PermissionsProvider>
);
