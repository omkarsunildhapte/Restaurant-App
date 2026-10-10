export const environment = {
    name: 'development',
    production: false,
    apiUrl: 'http://localhost:4000',
    supabase: {
        url: 'http://127.0.0.1:54321',
        // local Supabase default anon key (public, same for every local stack); see `supabase status`
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    },
    firebase: {
        apiKey: "AIzaSyAkInqz4Hoa41PmSZXaw_yxKDU72d4p8Ds",
        authDomain: "restaurant-7466c.firebaseapp.com",
        projectId: "restaurant-7466c",
        storageBucket: "restaurant-7466c.appspot.com",
        messagingSenderId: "612732878809",
        appId: "1:612732878809:web:7ab8c444264acb7fdd23c8",
        measurementId: "G-8J67FCPHE0"
    }
};
