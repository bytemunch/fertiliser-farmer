const intersecting = (
    v1x1, v1y1, v1x2, v1y2,
    v2x1, v2y1, v2x2, v2y2
) => {
    // Lifted from https://stackoverflow.com/users/15809/mecki
    // at https://stackoverflow.com/questions/217578/how-can-i-determine-whether-a-2d-point-is-within-a-polygon

    let d1, d2;
    let a1, a2, b1, b2, c1, c2;

    // Convert vector 1 to a line (line 1) of infinite length.
    // We want the line in linear equation standard form: A*x + B*y + C = 0
    // See: http://en.wikipedia.org/wiki/Linear_equation
    a1 = v1y2 - v1y1;
    b1 = v1x1 - v1x2;
    c1 = (v1x2 * v1y1) - (v1x1 * v1y2);

    // Every point (x,y), that solves the equation above, is on the line,
    // every point that does not solve it, is not. The equation will have a
    // positive result if it is on one side of the line and a negative one 
    // if is on the other side of it. We insert (x1,y1) and (x2,y2) of vector
    // 2 into the equation above.
    d1 = (a1 * v2x1) + (b1 * v2y1) + c1;
    d2 = (a1 * v2x2) + (b1 * v2y2) + c1;

    // If d1 and d2 both have the same sign, they are both on the same side
    // of our line 1 and in that case no intersection is possible. Careful, 
    // 0 is a special case, that's why we don't test ">=" and "<=", 
    // but "<" and ">".
    if (d1 > 0 && d2 > 0) return false;
    if (d1 < 0 && d2 < 0) return false;

    // The fact that vector 2 intersected the infinite line 1 above doesn't 
    // mean it also intersects the vector 1. Vector 1 is only a subset of that
    // infinite line 1, so it may have intersected that line before the vector
    // started or after it ended. To know for sure, we have to repeat the
    // the same test the other way round. We start by calculating the 
    // infinite line 2 in linear equation standard form.
    a2 = v2y2 - v2y1;
    b2 = v2x1 - v2x2;
    c2 = (v2x2 * v2y1) - (v2x1 * v2y2);

    // Calculate d1 and d2 again, this time using points of vector 1.
    d1 = (a2 * v1x1) + (b2 * v1y1) + c2;
    d2 = (a2 * v1x2) + (b2 * v1y2) + c2;

    // Again, if both have the same sign (and neither one is 0),
    // no intersection is possible.
    if (d1 > 0 && d2 > 0) return false;
    if (d1 < 0 && d2 < 0) return false;

    // If we get here, only two possibilities are left. Either the two
    // vectors intersect in exactly one point or they are collinear, which
    // means they intersect in any number of points from zero to infinite.
    if ((a1 * b2) - (a2 * b1) == 0.0) return false;

    // If they are not collinear, they must intersect in exactly one point.
    return true;
}

export const pointInPolygon = (polyPoints:number[][], testPoint:number[]) => {
    // TODO broad phase filtering
    let minX = Math.min(...polyPoints.map(v=>v[0]));
    let minY = Math.min(...polyPoints.map(v=>v[1]));

    let e = 20;

    let rayStart = [minX-e, minY-e];
    let rayEnd = testPoint;

    let dist = Math.sqrt(((rayStart[0]-rayEnd[0])**2 + (rayStart[1]-rayEnd[1])**2));
    if (dist > 100) return false;

    // Test intersections with lines
    let intersections = 0;
    for (let i = 0; i < polyPoints.length; i++) {
        let j = i + 1;
        if (i == polyPoints.length - 1) j = 0;

        if (intersecting(rayStart[0], rayStart[1], rayEnd[0], rayEnd[1],
            polyPoints[i][0], polyPoints[i][1], polyPoints[j][0], polyPoints[j][1])) {
            intersections++;
        }
    }

    return (intersections % 2 != 0);
}