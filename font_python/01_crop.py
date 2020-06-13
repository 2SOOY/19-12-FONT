# -*- coding: utf-8 -*-
# crop template

import os
import argparse
import numpy as np
import cv2
from PIL import Image
from PIL import ImageEnhance

# list division
def chunksList(List,size):
    for i in range(0, len(List), size):
        yield List[i : i + size]

# template size 280 X 200 mm
# space size    1.5 X 1.5 mm

def crop_image_uniform(src_dir, dst_dir, unicode_txt):
    if not os.path.exists(dst_dir):
        os.makedirs(dst_dir)

    imgList = sorted(os.listdir(src_dir))

    # unicode list matching template image
    idx = 0
    f = open(unicode_txt, 'r')
    charList = f.readlines()
    charList = [i.strip() for i in charList] # strip : delete '\n'

    # crop image
    for img in imgList:
        image = cv2.imread(os.path.join(src_dir,img))

        # grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        H, W = gray.shape

        # binary
        ret, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_OTSU | cv2.THRESH_BINARY_INV)

        # dilation
        kernel = np.ones((5, 5), np.uint8)
        img_dilation = cv2.dilate(thresh, kernel, iterations=1)

        # find contours
        # opencv > 4.0 ------------ ctrs,_ =
        # opencv < 4.0 ------------ _, ctrs, _ =
        ctrs, _ = cv2.findContours(img_dilation.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        cnt = 0
        rect = []

        for i, ctr in enumerate(ctrs):
            # Get bounding
            x, y, w, h = cv2.boundingRect(ctr)

            if 0.045 <= h / float(H) < 0.9 and 0.065 <= w / float(W) < 0.9:
                rect.append([x, y, w, h])
                cnt = cnt + 1


        # [ x,y,w,h ] 중 y 값에 대해 정렬 => row 만큼 묶을 수 있게 됨
        rect = sorted(rect, key=lambda k: [k[1]])

        rect = list(chunksList(rect, 12))  # 12개(= 1 row )만큼씩 묶어줌

        for row in rect:
            row = sorted(row, key=lambda k: [k[0]])  # row별로 column(=x 좌표)에 대해 정렬
            for rec in row:

                x, y, w, h = rec
                margin = 5
                origin_roi = image[y+margin : y+h-margin , x+margin : x+w-margin]
                roi = thresh[y+margin : y+h-margin , x+margin : x+w-margin]  # 1 is margin

                # To make contours on purpose
                open_kernel = np.ones((19,19), np.uint8)
                dilated_image = cv2.dilate(roi, open_kernel, iterations=1)


                contours, _ = cv2.findContours(dilated_image, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
                contours.sort(key=cv2.contourArea)



                # not save image not detected contour
                try:
                    _r = [contour for contour in contours][-1]

                except:
                    idx += 1
                    continue

                _x, _y, _w, _h = cv2.boundingRect(_r)


                # make empty white image
                background = np.zeros([128,128],dtype=np.uint8)
                background.fill(255)

                _roi = gray[y+margin : y+h-margin , x+margin : x+w-margin]
                # _roi = thresh[y+margin : y+h-margin , x+margin : x+w-margin]

                cropped_image = _roi[_y:_y+_h, _x:_x+_w]

                # resize according to width and height
                if _w > _h:
                    height_size = int(90 * _h / _w)
                    #print('h',height_size)
                    cropped_image = cv2.resize(cropped_image,(90, height_size))
                    background[int(64 - height_size / 2):int(64 - height_size / 2)+ cropped_image.shape[0],19:19+ cropped_image.shape[1]] = cropped_image
                else:
                    width_size = int(90 * _w / _h)
                    #print('w',width_size)
                    cropped_image = cv2.resize(cropped_image,(width_size, 90))
                    background[19:19+cropped_image.shape[0], int(64 - width_size / 2):int(64 - width_size / 2)+ cropped_image.shape[1]] = cropped_image

                # Processing to make the writing clearer
                img_arr = Image.fromarray(background)
                enhancerimg = ImageEnhance.Contrast(img_arr)
                _image = enhancerimg.enhance(1.5)
                opencv_image = np.array(_image)
                opencv_image = cv2.bilateralFilter(opencv_image, 9, 30, 30)

                # Save image
                name = dst_dir + '/uni' + charList[idx] + '.png'
                cv2.imwrite(name, opencv_image)

                idx += 1
                if idx == len(charList):
                    return

parser = argparse.ArgumentParser(description='Crop scanned images to character images')
parser.add_argument('--src_dir', dest='src_dir', required=True, help='directory to read scanned images')
parser.add_argument('--dst_dir', dest='dst_dir', required=True, help='directory to save character images')
parser.add_argument('--txt', dest='unicode_txt', required=True, help='unicode text file')

args = parser.parse_args()


if __name__ == '__main__':
    crop_image_uniform(args.src_dir, args.dst_dir, args.unicode_txt)

