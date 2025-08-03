import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  useCreatePublicationMutation, 
  useUpdatePublicationMutation,
  useGetPublicationDetailQuery 
} from '../../store/api/publicationsApi';
import { useAppSelector } from '../../store';
import { PublicationType, type CreatePublicationRequest } from '../../types/api';
import { toast } from 'sonner';

const publicationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500, 'Title is too long'),
  abstract: z.string().min(1, 'Abstract is required').max(5000, 'Abstract is too long'),
  keywords: z.string().min(1, 'At least one keyword is required'),
  type: z.enum([PublicationType.ARTICLE, PublicationType.BOOK]),
  coAuthorIds: z.string().optional(),
  targetJournal: z.string().optional(),
  section: z.string().optional(),
  bibliographicReferences: z.string().optional(),
  figureCount: z.number().optional(),
  tableCount: z.number().optional(),
  isbn: z.string().optional(),
  pageCount: z.number().optional(),
  edition: z.string().optional(),
});

type PublicationFormData = z.infer<typeof publicationSchema>;

interface PublicationFormProps {
  mode?: 'create' | 'edit';
  publicationId?: string;
}

const PublicationForm: React.FC<PublicationFormProps> = ({ mode = 'create', publicationId }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const user = useAppSelector((state) => state.auth.user);
  
  const [createPublication, { isLoading: isCreating }] = useCreatePublicationMutation();
  const [updatePublication, { isLoading: isUpdating }] = useUpdatePublicationMutation();
  
  const { data: publication } = useGetPublicationDetailQuery(id || publicationId!, {
    skip: mode === 'create' || (!id && !publicationId),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PublicationFormData>({
    resolver: zodResolver(publicationSchema),
    defaultValues: publication ? {
      title: publication.title,
      abstract: publication.abstract,
      keywords: publication.keywords.join(', '),
      type: publication.type,
      coAuthorIds: publication.coAuthorIds.join(', '),
      targetJournal: publication.metadata?.targetJournal || '',
      section: publication.metadata?.section || '',
      bibliographicReferences: publication.metadata?.bibliographicReferences?.join('\n') || '',
      figureCount: publication.metadata?.figureCount || 0,
      tableCount: publication.metadata?.tableCount || 0,
      isbn: publication.metadata?.isbn || '',
      pageCount: publication.metadata?.pageCount || 0,
      edition: publication.metadata?.edition || '',
    } : {
      type: PublicationType.ARTICLE,
      figureCount: 0,
      tableCount: 0,
      pageCount: 0,
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (data: PublicationFormData) => {
    if (!user) {
      toast.error('You must be logged in to create publications');
      return;
    }

    try {
      const keywords = data.keywords.split(',').map(k => k.trim()).filter(Boolean);
      const coAuthorIds = data.coAuthorIds ? 
        data.coAuthorIds.split(',').map(id => id.trim()).filter(Boolean) : [];
      
      const publicationData: CreatePublicationRequest = {
        title: data.title,
        abstract: data.abstract,
        keywords,
        primaryAuthorId: user.id,
        coAuthorIds,
        type: data.type,
        metadata: {},
      };

      if (data.type === PublicationType.ARTICLE) {
        publicationData.article = {
          targetJournal: data.targetJournal || '',
          section: data.section || '',
          bibliographicReferences: data.bibliographicReferences ? 
            data.bibliographicReferences.split('\n').filter(Boolean) : [],
          figureCount: data.figureCount,
          tableCount: data.tableCount,
        };
      } else if (data.type === PublicationType.BOOK) {
        publicationData.book = {
          isbn: data.isbn || '',
          pageCount: data.pageCount || 0,
          edition: data.edition || '1st',
        };
      }

      if (mode === 'create') {
        const result = await createPublication(publicationData).unwrap();
        toast.success('Publication created successfully!');
        navigate(`/publications/${result.id}`);
      } else if (mode === 'edit' && (id || publicationId)) {
        await updatePublication({ 
          id: id || publicationId!, 
          data: {
            title: data.title,
            abstract: data.abstract,
            keywords,
            coAuthorIds,
            metadata: publicationData.metadata,
          }
        }).unwrap();
        toast.success('Publication updated successfully!');
        navigate(`/publications/${id || publicationId}`);
      }
    } catch (error: any) {
      console.error('Error saving publication:', error);
      toast.error(error.data?.message || 'Failed to save publication');
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'New Publication' : 'Edit Publication'}
        </CardTitle>
        <CardDescription>
          {mode === 'create' 
            ? 'Create a new research publication' 
            : 'Update your research publication'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Publication Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Publication Type</Label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={PublicationType.ARTICLE}>Article</option>
              <option value={PublicationType.BOOK}>Book</option>
            </select>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter publication title"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              {...register('abstract')}
              placeholder="Enter publication abstract"
              rows={6}
            />
            {errors.abstract && (
              <p className="text-sm text-red-600">{errors.abstract.message}</p>
            )}
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <Input
              id="keywords"
              {...register('keywords')}
              placeholder="Enter keywords separated by commas"
            />
            {errors.keywords && (
              <p className="text-sm text-red-600">{errors.keywords.message}</p>
            )}
            <p className="text-sm text-gray-500">
              Separate multiple keywords with commas
            </p>
          </div>

          {/* Co-Authors */}
          <div className="space-y-2">
            <Label htmlFor="coAuthorIds">Co-Author IDs (Optional)</Label>
            <Input
              id="coAuthorIds"
              {...register('coAuthorIds')}
              placeholder="Enter co-author IDs separated by commas"
            />
            <p className="text-sm text-gray-500">
              Enter co-author user IDs separated by commas
            </p>
          </div>

          {/* Article-specific fields */}
          {selectedType === PublicationType.ARTICLE && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold">Article Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetJournal">Target Journal</Label>
                  <Input
                    id="targetJournal"
                    {...register('targetJournal')}
                    placeholder="Enter target journal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">Section</Label>
                  <Input
                    id="section"
                    {...register('section')}
                    placeholder="Enter journal section"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="figureCount">Figure Count</Label>
                  <Input
                    id="figureCount"
                    type="number"
                    min="0"
                    {...register('figureCount', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tableCount">Table Count</Label>
                  <Input
                    id="tableCount"
                    type="number"
                    min="0"
                    {...register('tableCount', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bibliographicReferences">Bibliographic References</Label>
                <Textarea
                  id="bibliographicReferences"
                  {...register('bibliographicReferences')}
                  placeholder="Enter references, one per line"
                  rows={4}
                />
                <p className="text-sm text-gray-500">
                  Enter each reference on a new line
                </p>
              </div>
            </div>
          )}

          {/* Book-specific fields */}
          {selectedType === PublicationType.BOOK && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-semibold">Book Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    {...register('isbn')}
                    placeholder="Enter ISBN"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageCount">Page Count</Label>
                  <Input
                    id="pageCount"
                    type="number"
                    min="1"
                    {...register('pageCount', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edition">Edition</Label>
                  <Input
                    id="edition"
                    {...register('edition')}
                    placeholder="e.g., 1st, 2nd, etc."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </div>
              ) : (
                mode === 'create' ? 'Create Publication' : 'Update Publication'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PublicationForm;