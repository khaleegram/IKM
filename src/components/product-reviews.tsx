'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, ThumbsUp, Loader2, MessageSquare, CheckCircle } from "lucide-react";
import { useProductReviews } from "@/lib/firebase/firestore/reviews";
import { useUser } from "@/lib/firebase/auth/use-user";
import { submitReview, markReviewHelpful, replyToReview } from "@/lib/review-actions";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductReviewsProps {
  productId: string;
  orderId?: string; // Optional: if user is reviewing from an order
}

export function ProductReviews({ productId, orderId }: ProductReviewsProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const { data: reviews, isLoading } = useProductReviews(productId);
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [isMarkingHelpful, startHelpfulTransition] = useTransition();
  const [isReplying, startReplyTransition] = useTransition();
  
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [replyText, setReplyText] = useState('');

  const userReview = reviews?.find(r => r.userId === user?.uid);
  const canReview = user && !userReview && orderId; // Can review if has order and hasn't reviewed yet

  const handleSubmitReview = () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Login Required', description: 'Please login to submit a review.' });
      return;
    }

    if (comment.length < 10) {
      toast({ variant: 'destructive', title: 'Review Too Short', description: 'Please write at least 10 characters.' });
      return;
    }

    startSubmitTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('productId', productId);
        formData.append('rating', rating.toString());
        formData.append('comment', comment);
        if (orderId) formData.append('orderId', orderId);

        await submitReview(formData);
        toast({
          title: "Review Submitted!",
          description: "Thank you for your review.",
        });
        setShowReviewDialog(false);
        setComment('');
        setRating(5);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    });
  };

  const handleMarkHelpful = (reviewId: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Login Required', description: 'Please login to mark reviews as helpful.' });
      return;
    }

    startHelpfulTransition(async () => {
      try {
        await markReviewHelpful(reviewId);
        toast({
          title: "Thank you!",
          description: "Your feedback helps other customers.",
        });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    });
  };

  const handleReply = (reviewId: string) => {
    if (!replyText || replyText.length < 5) {
      toast({ variant: 'destructive', title: 'Reply Too Short', description: 'Please write at least 5 characters.' });
      return;
    }

    startReplyTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('reply', replyText);

        await replyToReview(reviewId, formData);
        toast({
          title: "Reply Posted!",
          description: "Your reply has been posted.",
        });
        setShowReplyDialog(null);
        setReplyText('');
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
    });
  };

  const averageRating = reviews?.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews?.filter(r => r.rating === star).length || 0,
    percentage: reviews?.length ? ((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-headline">Customer Reviews</h2>
          {reviews && reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
            </div>
          )}
        </div>
        {canReview && (
          <Button onClick={() => setShowReviewDialog(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Rating Distribution */}
      {reviews && reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-medium">{star}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold">{review.userDisplayName || 'Anonymous'}</p>
                      {review.verifiedPurchase && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Purchase
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-muted-foreground">
                        {review.createdAt ? format(review.createdAt.toDate(), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base mb-3">{review.comment}</p>
                
                {/* Seller Reply */}
                {review.sellerReply && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-semibold mb-1">Seller Response</p>
                    <p className="text-sm">{review.sellerReply}</p>
                    {review.sellerReplyAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(review.sellerReplyAt.toDate(), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkHelpful(review.id!)}
                    disabled={isMarkingHelpful || !user || review.helpfulUsers?.includes(user.uid)}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    Helpful ({review.helpfulCount || 0})
                  </Button>
                  {user && productId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowReplyDialog(review.id!)}
                    >
                      Reply
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>Share your experience with this product.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review-comment">Your Review</Label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this product..."
                rows={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">{comment.length}/1000 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitReview} disabled={isSubmitting || comment.length < 10}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={!!showReplyDialog} onOpenChange={() => setShowReplyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
            <DialogDescription>Respond to the customer's review.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reply-text">Your Reply</Label>
              <Textarea
                id="reply-text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a response to this review..."
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">{replyText.length}/500 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReplyDialog(null)}>Cancel</Button>
            <Button onClick={() => showReplyDialog && handleReply(showReplyDialog)} disabled={isReplying || replyText.length < 5}>
              {isReplying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting...</> : 'Post Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

