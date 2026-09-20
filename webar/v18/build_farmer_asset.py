import cv2, numpy as np
from pathlib import Path

src=Path("webar/assets/markers/lamina01.jpg")
out=Path("webar/assets/farmer-slide1.webp")
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
print("farmer asset",out,crop.shape,"slide_box",x0,y0,x1,y1)
