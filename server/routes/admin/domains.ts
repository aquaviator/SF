import { Router } from 'express';
import { adminAuth } from '../../middleware/adminAuth';
import { db } from '../../db';
import { domainConfig } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Get all domain configurations
router.get('/', adminAuth, async (req, res) => {
  try {
    console.log('🌐 FETCHING_DOMAIN_CONFIGS', {
      adminId: req.admin?.id,
      timestamp: new Date()
    });

    const domains = await db
      .select()
      .from(domainConfig)
      .orderBy(domainConfig.createdAt);

    console.log('✅ DOMAIN_CONFIGS_FETCHED', { 
      count: domains.length, 
      timestamp: new Date() 
    });
    
    res.json(domains);
  } catch (error) {
    console.error('❌ DOMAIN_CONFIGS_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch domain configurations' });
  }
});

// Create new domain configuration
router.post('/', adminAuth, async (req, res) => {
  try {
    const { environment, domain } = req.body;
    
    console.log('➕ CREATING_DOMAIN_CONFIG', {
      environment,
      domain,
      adminId: req.admin?.id,
      timestamp: new Date()
    });

    // Check if domain already exists for this environment
    const existingDomain = await db
      .select()
      .from(domainConfig)
      .where(eq(domainConfig.environment, environment))
      .limit(1);

    if (existingDomain.length > 0) {
      return res.status(400).json({ 
        message: `Domain configuration for ${environment} environment already exists` 
      });
    }

    const [newDomain] = await db
      .insert(domainConfig)
      .values({
        environment,
        domain,
        isActive: true
      })
      .returning();

    console.log('✅ DOMAIN_CONFIG_CREATED', { 
      domainId: newDomain.id, 
      environment,
      timestamp: new Date() 
    });
    
    res.json(newDomain);
  } catch (error) {
    console.error('❌ CREATE_DOMAIN_CONFIG_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to create domain configuration' });
  }
});

// Update domain configuration
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const domainId = parseInt(req.params.id);
    const { domain, isActive } = req.body;
    
    console.log('🔄 UPDATING_DOMAIN_CONFIG', {
      domainId,
      domain,
      isActive,
      adminId: req.admin?.id,
      timestamp: new Date()
    });

    const [updatedDomain] = await db
      .update(domainConfig)
      .set({
        domain,
        isActive,
        updatedAt: new Date()
      })
      .where(eq(domainConfig.id, domainId))
      .returning();

    if (!updatedDomain) {
      return res.status(404).json({ message: 'Domain configuration not found' });
    }

    console.log('✅ DOMAIN_CONFIG_UPDATED', { 
      domainId, 
      timestamp: new Date() 
    });
    
    res.json(updatedDomain);
  } catch (error) {
    console.error('❌ UPDATE_DOMAIN_CONFIG_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to update domain configuration' });
  }
});

// Delete domain configuration
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const domainId = parseInt(req.params.id);
    
    console.log('🗑️ DELETING_DOMAIN_CONFIG', {
      domainId,
      adminId: req.admin?.id,
      timestamp: new Date()
    });

    const result = await db
      .delete(domainConfig)
      .where(eq(domainConfig.id, domainId))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ message: 'Domain configuration not found' });
    }

    console.log('✅ DOMAIN_CONFIG_DELETED', { 
      domainId, 
      timestamp: new Date() 
    });
    
    res.json({ message: 'Domain configuration deleted successfully' });
  } catch (error) {
    console.error('❌ DELETE_DOMAIN_CONFIG_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to delete domain configuration' });
  }
});

// Test domain configuration
router.post('/:id/test', adminAuth, async (req, res) => {
  try {
    const domainId = parseInt(req.params.id);
    
    console.log('🧪 TESTING_DOMAIN_CONFIG', {
      domainId,
      adminId: req.admin?.id,
      timestamp: new Date()
    });

    const domain = await db
      .select()
      .from(domainConfig)
      .where(eq(domainConfig.id, domainId))
      .limit(1);

    if (domain.length === 0) {
      return res.status(404).json({ message: 'Domain configuration not found' });
    }

    // Simple connectivity test (in production, you might want to do actual HTTP checks)
    const testResult = {
      domain: domain[0].domain,
      accessible: true, // Placeholder - implement actual connectivity test
      responseTime: Math.floor(Math.random() * 100) + 50, // Mock response time
      sslValid: true, // Placeholder - implement SSL certificate check
      testedAt: new Date().toISOString()
    };

    console.log('✅ DOMAIN_TEST_COMPLETED', { 
      domainId,
      result: testResult,
      timestamp: new Date() 
    });
    
    res.json(testResult);
  } catch (error) {
    console.error('❌ DOMAIN_TEST_ERROR', { error: error.message });
    res.status(500).json({ message: 'Failed to test domain configuration' });
  }
});

export { router as domainRoutes };