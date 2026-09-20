import cv2, numpy as np
from pathlib import Path

src=Path("webar/assets/markers/lamina01.jpg")
out=Path("webar/assets/farmer-slide1.webp")
body_out=Path("webar/assets/farmer-slide1-body.webp")
head_out=Path("webar/assets/farmer-slide1-head.webp")
img=cv2.imread(str(src),cv2.IMREAD_COLOR)
if img is None:
    raise SystemExit("lamina01.jpg not found")
h,w=img.shape[:2]
mask=np.zeros((h,w),np.uint8)
bgd=np.zeros((1,65),np.float64); fgd=np.zeros((1,65),np.float64)
rect=(int(w*.67),int(h*.16),int(w*.27),int(h*.73))
cv2.grabCut(img,mask,rect,bgd,fgd,8,cv2.GC_INIT_WITH_RECT)
alpha=np.where((mask==2)|(mask==0),0,255).astype("uint8")
Y,X=np.ogrid[:h,:w]
keep=((X>w*.66)&(X<w*.95)&(Y>h*.14)&(Y<h*.78))|((X>w*.70)&(X<w*.88)&(Y>=h*.70)&(Y<h*.96))
alpha=np.where(keep,alpha,0).astype("uint8")
alpha=cv2.GaussianBlur(alpha,(5,5),0)
ys,xs=np.where(alpha>10)
x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
rgba=cv2.cvtColor(img,cv2.COLOR_BGR2BGRA); rgba[:,:,3]=alpha
crop=rgba[y0:y1+1,x0:x1+1]
cv2.imwrite(str(out),crop,[cv2.IMWRITE_WEBP_QUALITY,84])
# Split the same source pixels into complementary body/head layers. At rest they recompose the original cutout.
ch,cw=crop.shape[:2]
head_mask=np.zeros((ch,cw),np.uint8)
cv2.ellipse(head_mask,(int(cw*.53),int(ch*.28)),(int(cw*.45),int(ch*.27)),0,0,360,255,-1)
head_mask=cv2.GaussianBlur(head_mask,(21,21),0)
head=crop.copy(); head[:,:,3]=cv2.min(crop[:,:,3],head_mask)
body=crop.copy(); body[:,:,3]=cv2.min(crop[:,:,3],255-head_mask)
cv2.imwrite(str(body_out),body,[cv2.IMWRITE_WEBP_QUALITY,90])
cv2.imwrite(str(head_out),head,[cv2.IMWRITE_WEBP_QUALITY,90])
print("farmer layers",body_out,head_out,crop.shape,"slide_box",x0,y0,x1,y1)
