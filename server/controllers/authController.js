const { supabase } = require('../utils/supabase');

const signup = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        
        // Save additional info into public.profiles
        if (data.user) {
            // We use upsert or plain insert. If the table doesn't exist, this will just log an error
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{ id: data.user.id, email: data.user.email }]);
                
            if (profileError) {
                console.error("Profile creation error (table might not exist yet):", profileError);
            }
        }
        
        return res.status(200).json({ message: 'User created successfully', user: data.user, session: data.session });
    } catch (error) {
        console.error("Signup exception:", error);
        return res.status(500).json({ error: 'Internal server error during sign up' });
    }
};

const signin = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            return res.status(400).json({ error: error.message });
        }
        
        return res.status(200).json({ message: 'Login successful', user: data.user, session: data.session });
    } catch (error) {
        console.error("Signin exception:", error);
        return res.status(500).json({ error: 'Internal server error during sign in' });
    }
};

module.exports = { signup, signin };
