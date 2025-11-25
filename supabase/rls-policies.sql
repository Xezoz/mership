-- Enable Row Level Security on all-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Inventory policies
CREATE POLICY "Inventory items are viewable by owner"
  ON public.inventory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own inventory items"
  ON public.inventory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inventory items"
  ON public.inventory FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inventory items"
  ON public.inventory FOR DELETE
  USING (auth.uid() = user_id);

-- Shipments policies
CREATE POLICY "Shipments are viewable by owner"
  ON public.shipments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shipments"
  ON public.shipments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shipments"
  ON public.shipments FOR UPDATE
  USING (auth.uid() = user_id);

-- Packages policies
-- Customers see their own packages. Reshippers see ALL packages.
CREATE POLICY "Packages are viewable by owner or reshippers"
  ON public.packages FOR SELECT
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'reshipper')
  );

-- Reshippers can insert/update packages. Customers can insert (declare) packages.
CREATE POLICY "Users can insert packages"
  ON public.packages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'reshipper')
  );

CREATE POLICY "Reshippers can update packages"
  ON public.packages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'reshipper')
  );

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = reshipper_id);

CREATE POLICY "Users can insert conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = reshipper_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND (customer_id = auth.uid() OR reshipper_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id 
      AND (customer_id = auth.uid() OR reshipper_id = auth.uid())
    )
  );

CREATE POLICY "Users can delete their own shipments"
  ON public.shipments
  FOR DELETE
  USING (auth.uid() = user_id);
