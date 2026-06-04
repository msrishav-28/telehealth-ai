// Deprecated compatibility shim.
// Server chat logic now lives in src/server/services/chat.service.ts.
// Client components should consume hooks/API clients, not instantiate services.
export { ChatService } from '@/server/services/chat.service';
