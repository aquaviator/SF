import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Save, Eye, Trash2, GripVertical, Type, Image as ImageIcon, Layout, Info } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface PageComponent {
  id: string;
  type: 'hero' | 'features' | 'pricing' | 'testimonials' | 'cta' | 'text';
  title?: string;
  content?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
  features?: Array<{ title: string; description: string; }>;
  config?: Record<string, any>;
}

interface LandingPage {
  id: number;
  tenant_id: string;
  layout: PageComponent[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function PageBuilder() {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [currentPage, setCurrentPage] = useState<LandingPage | null>(null);
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchLandingPages();
  }, []);

  const fetchLandingPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/landing-pages');
      if (response.ok) {
        const pages = await response.json();
        setLandingPages(pages);
        console.log('✅ LANDING_PAGES_LOADED', { count: pages.length });
      }
    } catch (error) {
      console.error('❌ LANDING_PAGES_ERROR', { error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadPageForTenant = (tenantId: string) => {
    const page = landingPages.find(p => p.tenant_id === tenantId);
    if (page) {
      setCurrentPage(page);
      setComponents(page.layout || []);
    } else {
      // Create new page for tenant
      setCurrentPage({
        id: 0,
        tenant_id: tenantId,
        layout: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setComponents([]);
    }
    setSelectedTenant(tenantId);
  };

  const addComponent = (type: PageComponent['type']) => {
    const newComponent: PageComponent = {
      id: `${type}_${Date.now()}`,
      type,
      title: getDefaultTitle(type),
      content: getDefaultContent(type)
    };

    setComponents([...components, newComponent]);
  };

  const getDefaultTitle = (type: string): string => {
    switch (type) {
      case 'hero': return 'Welcome to ShiftFlo';
      case 'features': return 'Powerful Features';
      case 'pricing': return 'Simple Pricing';
      case 'testimonials': return 'What Our Customers Say';
      case 'cta': return 'Ready to Get Started?';
      case 'text': return 'About Us';
      default: return 'New Section';
    }
  };

  const getDefaultContent = (type: string): string => {
    switch (type) {
      case 'hero': return 'The complete shift management solution for modern businesses.';
      case 'features': return 'Streamline your workforce management with our comprehensive platform.';
      case 'pricing': return 'Choose the plan that fits your business needs.';
      case 'testimonials': return 'Join thousands of businesses already using ShiftFlo.';
      case 'cta': return 'Start your free trial today and see the difference.';
      case 'text': return 'Add your content here.';
      default: return '';
    }
  };

  const updateComponent = (id: string, updates: Partial<PageComponent>) => {
    setComponents(components.map(comp => 
      comp.id === id ? { ...comp, ...updates } : comp
    ));
  };

  const deleteComponent = (id: string) => {
    setComponents(components.filter(comp => comp.id !== id));
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(components);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setComponents(items);
  };

  const savePage = async () => {
    if (!selectedTenant) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/landing-pages/${selectedTenant}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layout: components,
          isActive: currentPage?.is_active || true
        })
      });

      if (response.ok) {
        const updatedPage = await response.json();
        setCurrentPage(updatedPage);
        
        // Update the pages list
        setLandingPages(prev => {
          const existing = prev.find(p => p.tenant_id === selectedTenant);
          if (existing) {
            return prev.map(p => p.tenant_id === selectedTenant ? updatedPage : p);
          } else {
            return [...prev, updatedPage];
          }
        });

        console.log('✅ PAGE_SAVED', { 
          tenantId: selectedTenant, 
          components: components.length 
        });
      }
    } catch (error) {
      console.error('❌ PAGE_SAVE_ERROR', { error: error.message });
    } finally {
      setSaving(false);
    }
  };

  const renderComponentEditor = (component: PageComponent) => {
    return (
      <Card key={component.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GripVertical className="h-4 w-4 text-gray-400" />
              <Badge variant="outline">
                {component.type.charAt(0).toUpperCase() + component.type.slice(1)}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteComponent(component.id)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor={`title-${component.id}`}>Title</Label>
            <Input
              id={`title-${component.id}`}
              value={component.title || ''}
              onChange={(e) => updateComponent(component.id, { title: e.target.value })}
              placeholder="Enter title"
            />
          </div>

          <div>
            <Label htmlFor={`content-${component.id}`}>Content</Label>
            <Textarea
              id={`content-${component.id}`}
              value={component.content || ''}
              onChange={(e) => updateComponent(component.id, { content: e.target.value })}
              placeholder="Enter content"
              rows={3}
            />
          </div>

          {component.type === 'hero' || component.type === 'cta' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`button-text-${component.id}`}>Button Text</Label>
                <Input
                  id={`button-text-${component.id}`}
                  value={component.buttonText || ''}
                  onChange={(e) => updateComponent(component.id, { buttonText: e.target.value })}
                  placeholder="Get Started"
                />
              </div>
              <div>
                <Label htmlFor={`button-url-${component.id}`}>Button URL</Label>
                <Input
                  id={`button-url-${component.id}`}
                  value={component.buttonUrl || ''}
                  onChange={(e) => updateComponent(component.id, { buttonUrl: e.target.value })}
                  placeholder="/register"
                />
              </div>
            </div>
          ) : null}

          {component.type === 'hero' ? (
            <div>
              <Label htmlFor={`image-${component.id}`}>Hero Image URL</Label>
              <Input
                id={`image-${component.id}`}
                value={component.imageUrl || ''}
                onChange={(e) => updateComponent(component.id, { imageUrl: e.target.value })}
                placeholder="https://example.com/hero-image.jpg"
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    );
  };

  const renderPreview = (component: PageComponent) => {
    switch (component.type) {
      case 'hero':
        return (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">{component.title}</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">{component.content}</p>
            {component.buttonText && (
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors">
                {component.buttonText}
              </button>
            )}
          </div>
        );

      case 'features':
        return (
          <div className="py-16 px-8">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">{component.title}</h2>
              <p className="text-gray-600 mb-12">{component.content}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="p-6 border rounded-lg">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg mb-4 mx-auto"></div>
                    <h3 className="font-semibold mb-2">Feature {i}</h3>
                    <p className="text-gray-600 text-sm">Description of feature {i}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="py-16 px-8 bg-gray-50">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">{component.title}</h2>
              <p className="text-gray-600 mb-12">{component.content}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {['Starter', 'Pro'].map((plan, i) => (
                  <div key={plan} className="bg-white p-8 rounded-lg shadow-sm border">
                    <h3 className="text-xl font-semibold mb-4">{plan}</h3>
                    <div className="text-3xl font-bold mb-6">£{i === 0 ? '3' : '5'}<span className="text-sm text-gray-500">/seat/month</span></div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Choose Plan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="bg-blue-600 text-white py-16 px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">{component.title}</h2>
            <p className="text-xl mb-8">{component.content}</p>
            {component.buttonText && (
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {component.buttonText}
              </button>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="py-16 px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">{component.title}</h2>
              <div className="prose max-w-none">
                <p className="text-gray-600 leading-relaxed">{component.content}</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-8 px-8 bg-gray-100">
            <p className="text-center text-gray-500">Preview not available for this component type</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Page Builder</h1>
            <p className="text-gray-600 dark:text-gray-400">Create and manage custom landing pages for tenants</p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedTenant && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center space-x-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>{previewMode ? 'Edit' : 'Preview'}</span>
                </Button>
                <Button
                  onClick={savePage}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save Page'}</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tenant Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="tenant-select">Tenant ID</Label>
                <Input
                  id="tenant-select"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  placeholder="Enter tenant ID (e.g., acme-corp)"
                />
              </div>
              <Button
                onClick={() => selectedTenant && loadPageForTenant(selectedTenant)}
                disabled={!selectedTenant}
              >
                Load Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Page Builder Interface */}
        {selectedTenant && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Components Panel */}
            {!previewMode && (
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Plus className="h-5 w-5" />
                      <span>Add Components</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { type: 'hero', icon: Layout, label: 'Hero Section' },
                      { type: 'features', icon: Layout, label: 'Features Grid' },
                      { type: 'pricing', icon: Layout, label: 'Pricing Table' },
                      { type: 'testimonials', icon: Layout, label: 'Testimonials' },
                      { type: 'cta', icon: Layout, label: 'Call to Action' },
                      { type: 'text', icon: Type, label: 'Text Block' }
                    ].map(({ type, icon: Icon, label }) => (
                      <Button
                        key={type}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => addComponent(type as PageComponent['type'])}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Page Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tenant:</span>
                        <span className="font-medium">{selectedTenant}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Components:</span>
                        <span className="font-medium">{components.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={currentPage?.is_active ? 'default' : 'secondary'}>
                          {currentPage?.is_active ? 'Active' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Content Area */}
            <div className={`${previewMode ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-6`}>
              {previewMode ? (
                /* Preview Mode */
                <Card>
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border rounded-lg overflow-hidden">
                      {components.length > 0 ? (
                        components.map((component) => (
                          <div key={component.id}>
                            {renderPreview(component)}
                          </div>
                        ))
                      ) : (
                        <div className="py-20 text-center text-gray-500">
                          <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No components added yet</p>
                          <p className="text-sm">Switch to edit mode to add components</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Edit Mode */
                <Card>
                  <CardHeader>
                    <CardTitle>Page Components</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {components.length > 0 ? (
                      <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="components">
                          {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                              {components.map((component, index) => (
                                <Draggable
                                  key={component.id}
                                  draggableId={component.id}
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                    >
                                      {renderComponentEditor(component)}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    ) : (
                      <div className="text-center py-20 text-gray-500">
                        <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No components yet</h3>
                        <p className="mb-4">Add components from the panel on the left to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Existing Pages */}
        {landingPages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Existing Landing Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {landingPages.map((page) => (
                  <div key={page.tenant_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{page.tenant_id}</h3>
                      <p className="text-sm text-gray-600">
                        {page.layout.length} components • Updated {new Date(page.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={page.is_active ? 'default' : 'secondary'}>
                        {page.is_active ? 'Active' : 'Draft'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadPageForTenant(page.tenant_id)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}