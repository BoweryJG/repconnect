-- Create user_gmail_tokens table for storing Gmail OAuth tokens
CREATE TABLE IF NOT EXISTS public.user_gmail_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, email)
);

-- Create index for faster lookups
CREATE INDEX idx_user_gmail_tokens_user_id ON public.user_gmail_tokens(user_id);
CREATE INDEX idx_user_gmail_tokens_email ON public.user_gmail_tokens(email);

-- Enable Row Level Security
ALTER TABLE public.user_gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow users to only see and manage their own tokens
CREATE POLICY "Users can view their own Gmail tokens" ON public.user_gmail_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Gmail tokens" ON public.user_gmail_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Gmail tokens" ON public.user_gmail_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Gmail tokens" ON public.user_gmail_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_gmail_tokens_updated_at BEFORE UPDATE ON public.user_gmail_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment to the table
COMMENT ON TABLE public.user_gmail_tokens IS 'Stores Gmail OAuth tokens for authenticated users';
COMMENT ON COLUMN public.user_gmail_tokens.user_id IS 'Reference to the authenticated user';
COMMENT ON COLUMN public.user_gmail_tokens.email IS 'Gmail email address associated with the token';
COMMENT ON COLUMN public.user_gmail_tokens.access_token IS 'OAuth access token for Gmail API';
COMMENT ON COLUMN public.user_gmail_tokens.refresh_token IS 'OAuth refresh token for Gmail API';
COMMENT ON COLUMN public.user_gmail_tokens.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN public.user_gmail_tokens.scope IS 'OAuth scopes granted for this token';