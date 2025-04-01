import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  insertCategorySchema, 
  insertBankSchema, 
  insertCardSchema, 
  insertArticleSchema, 
  insertCalculatorSchema 
} from "@shared/schema";
import session from "express-session";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "cardsavvy-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 3600000 }, // 1 hour
    })
  );

  // Authentication middleware for admin routes
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const { username, password } = result.data;
      const user = await storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set user session
      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;

      return res.status(200).json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
      });
    } catch (error) {
      console.error("Get me error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      return res.status(200).json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const category = await storage.getCategory(id);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.status(200).json(category);
    } catch (error) {
      console.error("Get category error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/categories", requireAuth, async (req, res) => {
    try {
      const result = insertCategorySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const category = await storage.createCategory(result.data);
      return res.status(201).json(category);
    } catch (error) {
      console.error("Create category error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertCategorySchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const updatedCategory = await storage.updateCategory(id, result.data);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.status(200).json(updatedCategory);
    } catch (error) {
      console.error("Update category error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/categories/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCategory(id);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete category error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Banks API
  app.get("/api/banks", async (req, res) => {
    try {
      const banks = await storage.getAllBanks();
      return res.status(200).json(banks);
    } catch (error) {
      console.error("Get banks error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/banks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const bank = await storage.getBank(id);
      
      if (!bank) {
        return res.status(404).json({ message: "Bank not found" });
      }
      
      return res.status(200).json(bank);
    } catch (error) {
      console.error("Get bank error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/banks", requireAuth, async (req, res) => {
    try {
      const result = insertBankSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const bank = await storage.createBank(result.data);
      return res.status(201).json(bank);
    } catch (error) {
      console.error("Create bank error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/banks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertBankSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const updatedBank = await storage.updateBank(id, result.data);
      
      if (!updatedBank) {
        return res.status(404).json({ message: "Bank not found" });
      }
      
      return res.status(200).json(updatedBank);
    } catch (error) {
      console.error("Update bank error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/banks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBank(id);
      
      if (!success) {
        return res.status(404).json({ message: "Bank not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete bank error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Cards API
  app.get("/api/cards", async (req, res) => {
    try {
      const { categoryId, bankId, featured } = req.query;
      
      let cards;
      if (categoryId) {
        cards = await storage.getCardsByCategory(parseInt(categoryId as string));
      } else if (bankId) {
        cards = await storage.getCardsByBank(parseInt(bankId as string));
      } else if (featured === 'true') {
        cards = await storage.getFeaturedCards();
      } else {
        cards = await storage.getAllCards();
      }
      
      return res.status(200).json(cards);
    } catch (error) {
      console.error("Get cards error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/cards/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const card = await storage.getCard(id);
      
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      return res.status(200).json(card);
    } catch (error) {
      console.error("Get card error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/cards", requireAuth, async (req, res) => {
    try {
      const result = insertCardSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const card = await storage.createCard(result.data);
      return res.status(201).json(card);
    } catch (error) {
      console.error("Create card error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/cards/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertCardSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const updatedCard = await storage.updateCard(id, result.data);
      
      if (!updatedCard) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      return res.status(200).json(updatedCard);
    } catch (error) {
      console.error("Update card error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/cards/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCard(id);
      
      if (!success) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete card error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Articles API
  app.get("/api/articles", async (req, res) => {
    try {
      const { limit } = req.query;
      
      let articles;
      if (limit) {
        articles = await storage.getRecentArticles(parseInt(limit as string));
      } else {
        articles = await storage.getAllArticles();
      }
      
      return res.status(200).json(articles);
    } catch (error) {
      console.error("Get articles error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      return res.status(200).json(article);
    } catch (error) {
      console.error("Get article error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/articles", requireAuth, async (req, res) => {
    try {
      const result = insertArticleSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const article = await storage.createArticle(result.data);
      return res.status(201).json(article);
    } catch (error) {
      console.error("Create article error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/articles/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertArticleSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const updatedArticle = await storage.updateArticle(id, result.data);
      
      if (!updatedArticle) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      return res.status(200).json(updatedArticle);
    } catch (error) {
      console.error("Update article error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/articles/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteArticle(id);
      
      if (!success) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete article error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Calculators API
  app.get("/api/calculators", async (req, res) => {
    try {
      const calculators = await storage.getAllCalculators();
      return res.status(200).json(calculators);
    } catch (error) {
      console.error("Get calculators error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/calculators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const calculator = await storage.getCalculator(id);
      
      if (!calculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }
      
      return res.status(200).json(calculator);
    } catch (error) {
      console.error("Get calculator error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/calculators", requireAuth, async (req, res) => {
    try {
      const result = insertCalculatorSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const calculator = await storage.createCalculator(result.data);
      return res.status(201).json(calculator);
    } catch (error) {
      console.error("Create calculator error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/calculators/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertCalculatorSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input" });
      }

      const updatedCalculator = await storage.updateCalculator(id, result.data);
      
      if (!updatedCalculator) {
        return res.status(404).json({ message: "Calculator not found" });
      }
      
      return res.status(200).json(updatedCalculator);
    } catch (error) {
      console.error("Update calculator error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/calculators/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCalculator(id);
      
      if (!success) {
        return res.status(404).json({ message: "Calculator not found" });
      }
      
      return res.status(204).send();
    } catch (error) {
      console.error("Delete calculator error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // AI Chat mock endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Invalid input" });
      }
      
      // Simple mock response
      let response;
      if (message.toLowerCase().includes("cashback")) {
        response = "Based on your interest in cashback cards, I recommend the Citi Double Cash Card which offers 2% on all purchases (1% when you buy, 1% when you pay) with no annual fee.";
      } else if (message.toLowerCase().includes("travel")) {
        response = "For travel benefits, the Chase Sapphire Preferred is an excellent choice with a $95 annual fee but offering 2x points on travel and dining, and a great sign-up bonus.";
      } else if (message.toLowerCase().includes("credit score")) {
        response = "To improve your credit score, focus on paying bills on time, keeping credit utilization low, and monitoring your credit report for errors.";
      } else {
        response = "I can help you find the perfect credit card! Tell me more about what you're looking for - cashback, travel rewards, or building credit?";
      }
      
      return res.status(200).json({ response });
    } catch (error) {
      console.error("Chat error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
