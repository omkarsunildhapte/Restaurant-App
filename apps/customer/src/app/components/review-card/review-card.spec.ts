import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/provide';
import { ReviewCard } from '@components/review-card/review-card';
import { REVIEW_PLACEHOLDERS } from '@constants/reviews.constants';

describe('ReviewCard', () => {
  it('renders the author, text and likes', async () => {
    TestBed.configureTestingModule({ providers: [provideIonicAngular()] });
    const fixture = TestBed.createComponent(ReviewCard);
    fixture.componentRef.setInput('review', REVIEW_PLACEHOLDERS[0]);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Victoria Champain');
    expect(text).toContain('132 likes');
  });
});
