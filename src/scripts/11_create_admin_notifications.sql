-- Create admin_notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
    target_group TEXT NOT NULL CHECK (target_group IN ('all', 'users', 'shop_owners')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage notifications" ON admin_notifications
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view relevant notifications" ON admin_notifications
    FOR SELECT
    USING (
        target_group = 'all' OR
        (target_group = 'users' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'user')) OR
        (target_group = 'shop_owners' AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'shop_owner'))
    );
